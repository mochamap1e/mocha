import sharp from "sharp";
import { eq, sql } from "drizzle-orm";
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

import { db } from "@/db/client";
import { user } from "@/db/schema";
import { pointercrate, global, aredl } from "@/utils/lists";
import { getAccount } from "@/utils/account";

import type { Sharp } from "sharp";
import type { ButtonInteraction, TextChannel, User } from "discord.js";
import type { ListIntegration } from "@/classes/listIntegration";

//////// VARIABLES

const imageName = "level.jpg";
const imageUrl = "attachment://" + imageName;

const time = 30000;

const startPoints = 100;
const pointLoss = 18;

const startPixelation = 25;
const reveal1Pixelation = 15;
const reveal2Pixelation = 10;

const maxTypos = 2;
const maxStreak = 10;

let currentlyPlaying: string[] = [];
let channelsCurrentlyPlaying: string[] = [];

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
            description: "Guess the list level based on the pixelated screenshot!"
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addIntegerOption(option =>
                    option
                        .setName("list")
                        .setDescription("Which list to use. 1 = Pointercrate, 2 = Global Demonlist, 3 = AREDL")
                        .setMinValue(1)
                        .setMaxValue(3)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName("limit")
                        .setDescription("How far back in the list to go")
                        .setMinValue(150)
                        .setRequired(false)
                ),
            {
                idHints: []
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {

        const listInput = interaction.options.getInteger("list", false);
        const limitInput = interaction.options.getInteger("limit", false);

        if (!listInput || listInput === 1) {
            this.game(interaction, pointercrate, "Pointercrate");
        } else if (listInput === 2) {
            this.game(interaction, global, "Global Demonlist", limitInput);
        } else if (listInput === 3) {
            this.game(interaction, aredl, "AREDL", limitInput);
        }
    }

    private async game(interaction: Command.ChatInputCommandInteraction | ButtonInteraction, list: ListIntegration, listName: string, limit?: number) {
        const channel = interaction.channel as TextChannel;

        if (currentlyPlaying.includes(interaction.user.id))
            return interaction.reply({ content: "You are already playing this game!", flags: MessageFlags.Ephemeral });

        if (channelsCurrentlyPlaying.includes(channel.id))
            return interaction.reply({ content: "There is already a game in this channel!", flags: MessageFlags.Ephemeral });

        currentlyPlaying.push(interaction.user.id);
        channelsCurrentlyPlaying.push(channel.id);

        await interaction.deferReply();

        const game = this;
        const level = await list.getRandomLevel(limit);

        ////////// EMBED //////////

        // embed

        const embed = new EmbedBuilder()
            .setTitle(`Guess the list level! (${listName})`)
            .setDescription(`You have ${time / 1000} seconds.\n`)
            .setImage(imageUrl);

        // buttons

        const hintButton = new ButtonBuilder()
            .setCustomId("hint")
            .setLabel("Hint")
            .setEmoji("\u{1F4A1}")
            .setStyle(ButtonStyle.Primary);

        const revealMoreButton = new ButtonBuilder()
            .setCustomId("revealMore")
            .setLabel("Reveal more")
            .setEmoji("\u{1F441}\u{FE0F}")
            .setStyle(ButtonStyle.Primary);

        const giveUpButton = new ButtonBuilder()
            .setCustomId("giveUp")
            .setLabel("Give up")
            .setEmoji("\u{274C}")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(hintButton, revealMoreButton, giveUpButton);

        ////////// GAME //////////

        let points = startPoints;
        let hints = 0;
        let reveals = 0;
        let ended = false;
        let playedAgain = false;

        const originalImage = await game.createOriginalImage(level.level_id);
        const originalImageAttachment = new AttachmentBuilder(originalImage, { name: imageName });

        const pixelatedImage = await game.createPixelatedImage(originalImage, startPixelation);

        const reply = await interaction.editReply({
            embeds: [embed],
            components: [row],
            files: [pixelatedImage]
        });

        const timer = setTimeout(async () => {
            await game.clearStreak(interaction.user);
            endGame(GameEndReason.TimeUp);
        }, time);

        async function endGame(reason: GameEndReason, winner?: User) {
            if (ended) return;

            ended = true;

            clearTimeout(timer);
            buttonCollector.stop();
            messageCollector.stop();

            const answerString = `The level was ${level.name} (#${level.position})`;

            embed.setTitle("Game over!");

            switch(reason) {
                case GameEndReason.CorrectAnswer:
                    const account = await getAccount(winner);

                    const hasStreak = account.guessStreak > 0;
                    const hasMaxStreak = account.guessStreak >= maxStreak;

                    if (hasStreak) {
                        points *= (hasMaxStreak ? maxStreak : (account.guessStreak + 1));
                    };

                    const [updatedAccount] = await db
                        .update(user)
                        .set({
                            points: sql`${user.points} + ${points}`,
                            guessStreak: sql`${user.guessStreak} + 1`
                        })
                        .where(eq(user.discordId, winner.id))
                        .returning();

                    const fields = [
                        `<@${winner.id}> got it. ${answerString}`,
                        `+${points} points ${hasStreak ? `(${updatedAccount.guessStreak}x streak! \u{1F525})` : ""} ` +
                        `| total ${updatedAccount.points.toLocaleString()} points`
                    ];

                    embed.setDescription(fields.join("\n\n"));

                    break;
                case GameEndReason.GaveUp:
                    embed.setDescription(`<@${interaction.user.id}> gave up. ${answerString}`);
                    break;
                case GameEndReason.TimeUp:
                    embed.setTitle("Time's up!");
                    embed.setDescription(answerString);
                    break;
            }

            const idInCurrentlyPlaying = currentlyPlaying.indexOf(interaction.user.id);
            if (idInCurrentlyPlaying !== -1) currentlyPlaying.splice(idInCurrentlyPlaying, 1);

            const idInChannelsCurrentlyPlaying = channelsCurrentlyPlaying.indexOf(channel.id);
            if (idInChannelsCurrentlyPlaying !== -1) channelsCurrentlyPlaying.splice(idInChannelsCurrentlyPlaying, 1);

            const playAgainButton = new ButtonBuilder()
                .setCustomId("again")
                .setLabel("Play again")
                .setEmoji("\u{1F501}")
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(playAgainButton);

            interaction.editReply({
                embeds: [embed],
                components: [row],
                files: [originalImageAttachment]
            });

            const buttonCollector2 = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time });

            buttonCollector2.on("collect", async (collected) => {
                //@ts-ignore
                if (collected.customId === playAgainButton.data.custom_id) {
                    if (!playedAgain) {
                        buttonCollector2.stop();
                        
                        playedAgain = true;

                        interaction.editReply({ components: [] });

                        game.game(collected, list, listName, limit);

                        return;
                    }
                }
            });

            setTimeout(() => { if (!playedAgain) { interaction.editReply({ components: [] }) } }, time);
        }

        // BUTTON HANDLER

        const buttonCollector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time });

        buttonCollector.on("collect", async (collected) => {
            //@ts-ignore
            if (collected.customId === hintButton.data.custom_id) {
                let hint;
                if (hints < 2) hints += 1;

                points -= pointLoss;

                if (hints === 1) hint = `This level was published by ${level.publisher}.`;
                if (hints === 2) {
                    hint = `This level was verified by ${level.verifier}.`;

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
                if (reveals < 2) reveals += 1;

                points -= pointLoss;

                if (reveals === 1) pixelation = reveal1Pixelation;
                if (reveals === 2) {
                    pixelation = reveal2Pixelation;

                    if (hints < 2) {
                        row.setComponents(hintButton, giveUpButton);
                    } else {
                        row.setComponents(giveUpButton);
                    }
                };

                const pixelatedImage = await game.createPixelatedImage(originalImage, pixelation);

                await collected.update({
                    components: [row],
                    files: [pixelatedImage]
                });
            }

            //@ts-ignore
            if (collected.customId === giveUpButton.data.custom_id) {
                if (collected.user.id !== interaction.user.id) {
                    if (!interaction.replied && !interaction.deferred) { // fix "The reply to this interaction has already been sent or deferred."
                        interaction.reply({
                            content: "You cannot use this action.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    return;
                }

                await game.clearStreak(collected.user);

                endGame(GameEndReason.GaveUp, collected.user);
            }
        });

        // ANSWER HANDLER

        const messageCollector = channel.createMessageCollector({ time });

        messageCollector.on("collect", async (collected) => {
            if (!collected.author.bot) {
                const input = collected.content.toLowerCase().replace(/\s+/g, " ");
                const levelName = level.name.toLowerCase();

                if (distance(input, levelName) <= maxTypos) {
                    collected.react("\u{2705}");
                    endGame(GameEndReason.CorrectAnswer, collected.author);
                } else {
                    game.clearStreak(collected.author);
                }
            }
        });
    }

    private async createOriginalImage(levelId: number) {
        const imageUrl = `https://levelthumbs.prevter.me/thumbnail/${levelId}/small`;

        // get image buffer
        const fetchedImage = await fetch(imageUrl);
        const arrayBuffer = await fetchedImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // create sharp image
        const image = sharp(buffer);

        return image;
    }

    private async createPixelatedImage(image: Sharp, pixelSize: number) {
        const metadata = await image.metadata();

        const smallWidth = Math.round(metadata.width / pixelSize);
        const smallHeight = Math.round(metadata.height / pixelSize);
        const pixelatedWidth = smallWidth * pixelSize;
        const pixelatedHeight = smallHeight * pixelSize;

        const clone = image.clone();

        const smallImage = await clone.resize(smallWidth, smallHeight, { kernel: sharp.kernel.nearest }).toBuffer();
        const pixelatedImage = sharp(smallImage).resize(pixelatedWidth, pixelatedHeight, { kernel: sharp.kernel.nearest });

        return new AttachmentBuilder(pixelatedImage, { name: imageName });
    }

    private async clearStreak(targetUser: User) {
        const account = await getAccount(targetUser);
                    
        if (account.guessStreak > 0) {
            await db
                .update(user)
                .set({ guessStreak: 0 })
                .where(eq(user.discordId, targetUser.id));
        }
    }
}