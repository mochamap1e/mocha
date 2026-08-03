import sharp from "sharp";
import { randomInt } from "mathjs";
import { sql, eq } from "drizzle-orm";
import { distance } from "fastest-levenshtein";
import { Command } from "@sapphire/framework";
import {
    AttachmentBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags,
} from "discord.js";
import type { Sharp } from "sharp";
import type { TextChannel, User } from "discord.js";

import { db } from "@/db/client";
import { user } from "@/db/schema";
import { getList } from "@/utils/pointercrate";

//////// VARIABLES

const imageName = "level.jpg";
const imageUrl = "attachment://" + imageName;

const time = 30;
const timeMs = time * 1000;

const startPoints = 100;
const pointLoss = 15;

const startPixelation = 25;
const reveal1Pixelation = 15;
const reveal2Pixelation = 10;

const maxTypos = 2;

enum GameEndReason {
    CorrectAnswer,
    GaveUp,
    TimeUp
}

//////// MAIN

export class Guess extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "guess",
            description: "Guess the list level based on the pixelated thumbnail!"
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description),
            {
                idHints: []
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();

        const channel = interaction.channel as TextChannel;

        ////////// SETUP //////////

        const list = getList(); if (!list) return interaction.editReply("For some reason I don't have access to the current demonlist.");
        const level = list[randomInt(0, list.length)]!;

        ////////// EMBED //////////

        // embed

        const embed = new EmbedBuilder()
            .setTitle("Guess the list level!")
            .setDescription(`You have ${time} seconds.\n`)
            .setImage(imageUrl);

        // buttons

        const hintButton = new ButtonBuilder()
            .setCustomId("hint")
            .setLabel("\u{1F4A1} Hint")
            .setStyle(ButtonStyle.Primary);

        const revealMoreButton = new ButtonBuilder()
            .setCustomId("revealMore")
            .setLabel("\u{1F441}\u{FE0F} Reveal more")
            .setStyle(ButtonStyle.Primary);

        const giveUpButton = new ButtonBuilder()
            .setCustomId("giveUp")
            .setLabel("\u{274C} Give up")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(hintButton, revealMoreButton, giveUpButton);

        ////////// GAME //////////

        let points = startPoints;
        let hints = 0;
        let reveals = 0;
        let ended = false

        const originalImage = await this.createOriginalImage(level.video!);
        const originalImageAttachment = new AttachmentBuilder(originalImage, { name: imageName });

        const pixelatedImage = await this.createPixelatedImage(originalImage, startPixelation);

        const reply = await interaction.editReply({
            embeds: [embed],
            components: [row],
            files: [pixelatedImage]
        });

        const timer = setTimeout(() => endGame(GameEndReason.TimeUp), timeMs);

        async function endGame(reason: GameEndReason, winner?: User) {
            if (ended) return;

            ended = true;

            clearTimeout(timer);
            buttonCollector.stop();
            messageCollector.stop();

            const answerString = `The level was ${level.name}.`;

            embed.setTitle("Game over!");

            switch(reason) {
                case GameEndReason.CorrectAnswer:
                    const [account] = await db
                        .update(user)
                        .set({
                            points: sql`${user.points} + ${points}`
                        })
                        .where(eq(user.discordId, winner!.id))
                        .returning();

                    embed.setDescription(`<@${winner!.id}> got it. ${answerString}\n\n(+${points} points, total ${account!.points.toLocaleString()} points)`);

                    break;
                case GameEndReason.GaveUp:
                    embed.setDescription(`<@${interaction.user.id}> gave up. ${answerString}`);
                    break;
                case GameEndReason.TimeUp:
                    embed.setTitle("Time's up!");
                    embed.setDescription(answerString);
                    break;
            }

            interaction.editReply({
                embeds: [embed],
                components: [],
                files: [originalImageAttachment]
            });
        }

        // BUTTON HANDLER

        const buttonCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: timeMs
        });

        buttonCollector.on("collect", async (collected) => {
            //@ts-ignore
            if (collected.customId === hintButton.data.custom_id) {
                let hint;

                hints += 1;
                points -= pointLoss;

                if (hints === 1) hint = `This level is on the ${level.position <= 75 ? "main" : "extended"} list.`;
                if (hints === 2) hint = `This level was published by ${level.publisher.name}.`;
                if (hints === 3) {
                    hint = `This level was verified by ${level.verifier.name}.`;

                    if (reveals < 2) {
                        row.setComponents(revealMoreButton, giveUpButton)
                    } else {
                        row.setComponents(giveUpButton);
                    }
                }

                embed.setDescription(embed.data.description + `\n${hint}`);

                await collected.update({
                    embeds: [embed],
                    components: [row]
                });
            }

            //@ts-ignore
            if (collected.customId === revealMoreButton.data.custom_id) {
                let pixelation;

                reveals += 1;
                points -= pointLoss;

                if (reveals === 1) pixelation = reveal1Pixelation;
                if (reveals === 2) {
                    pixelation = reveal2Pixelation;

                    if (hints < 3) {
                        row.setComponents(hintButton, giveUpButton);
                    } else {
                        row.setComponents(giveUpButton);
                    }
                };

                const pixelatedImage = await this.createPixelatedImage(originalImage, pixelation!);

                await collected.update({
                    components: [row],
                    files: [pixelatedImage]
                });
            }

            //@ts-ignore
            if (collected.customId === giveUpButton.data.custom_id) {
                if (collected.user.id !== interaction.user.id) {
                    interaction.reply({
                        content: "You cannot use this action.",
                        flags: MessageFlags.Ephemeral
                    });

                    return;
                }

                endGame(GameEndReason.GaveUp, collected.user);
            }
        });

        // ANSWER HANDLER

        const messageCollector = channel.createMessageCollector({ time: timeMs });

        messageCollector.on("collect", (collected) => {
            const input = collected.content.toLowerCase().replace(/\s+/g, " ");
            const levelName = level.name.toLowerCase();

            if (distance(input, levelName) <= maxTypos) {
                collected.react("\u{2705}");
                endGame(GameEndReason.CorrectAnswer, collected.author);
            } else {
                collected.react("\u{274C}");
            }
        });
    }

    private async createOriginalImage(ytLink: string) {
        const videoId = ytLink.replace("https://www.youtube.com/watch?v=", "");
        const imageUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // get image buffer
        const fetchedImage = await fetch(imageUrl);
        const arrayBuffer = await fetchedImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // create sharp image
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // crop image
        const originalImage = image.extract({
            left: 0,
            top: 45,
            width: metadata.width,
            height: 270
        });

        return originalImage;
    }

    private async createPixelatedImage(image: Sharp, pixelSize: number) {
        const metadata = await image.metadata();

        const smallWidth = Math.round(metadata.width / pixelSize);
        const smallHeight = Math.round(metadata.height / pixelSize);
        const pixelatedWidth = smallWidth * pixelSize;
        const pixelatedHeight = smallHeight * pixelSize;

        const smallImage = sharp(await image.clone().resize(smallWidth, smallHeight, { kernel: sharp.kernel.nearest }).toBuffer());
        const pixelatedImage = smallImage.resize(pixelatedWidth, pixelatedHeight, { kernel: sharp.kernel.nearest });

        return new AttachmentBuilder(pixelatedImage, { name: imageName });
    }
}