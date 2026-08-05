import { Command } from "@sapphire/framework";
import {
    EmbedBuilder,
    ButtonBuilder, 
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    LabelBuilder,
    TextInputStyle,
    User,
    ComponentType
} from "discord.js";
import { randomInt } from "mathjs";

import { getAccount, modifyPoints } from "@/utils/account";

const minTrackLength = 20;
const maxTrackLength = 40;

const trackCharacter = "\\_";
const startCharacter = "[";
const endCharacter = "]";

const pointsLabel = "How many points do you want to gamble?";
const minGamble = 10;

interface Horse {
    user: User,
    emoji: string,
    trackLine: string,
    position: number,
    pointsGambled: number
}

export class HorseRace extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "horse-race",
            description: "Play a horse race with friends!"
        });
    }

    private trackLength: number;

    private horses: Horse[] = [];
    private winners: Horse[] = [];

    private tick: any;

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addIntegerOption(option =>
                    option
                        .setName("points")
                        .setDescription(pointsLabel)
                        .setMinValue(minGamble)
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("track-length")
                        .setDescription("The length of the race track (measured in underscores)")
                        .setMinValue(minTrackLength)
                        .setMaxValue(maxTrackLength)
                        .setRequired(false)
                ),
            {
                idHints: []
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        /*
        const modal = new ModalBuilder()
            .setTitle("Horse Race Setup")
            .setCustomId("modal");

        const textInput = new TextInputBuilder()
            .setCustomId("textInput")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputLabel = new LabelBuilder()
            .setLabel(pointsLabel)
            .setDescription("Input ONLY a number (example: 2000)")
            .setTextInputComponent(textInput);

        modal.addLabelComponents(inputLabel);

        await interaction.showModal(modal);
        */

        await interaction.deferReply();

        const game = this;
        const hostGamble = interaction.options.getInteger("points", true);

        game.trackLength = interaction.options.getInteger("track-length", false) ?? minTrackLength;

        // SETUP

        const hostAccount = await getAccount(interaction.user);

        if (hostGamble > hostAccount.points) {
            interaction.editReply(`You cannot gamble more points than you have! You have ${hostAccount.points} points.`);
            return;
        }

        await game.joinRace(interaction.user, hostGamble);

        const embed = new EmbedBuilder()
            .setTitle("Horse race!");

        const joinButton = new ButtonBuilder()
            .setCustomId("join")
            .setLabel("\u{1F464} Join")
            .setStyle(ButtonStyle.Primary);

        const startButton = new ButtonBuilder()
            .setCustomId("start")
            .setLabel("\u{1F3C1} Start!")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(joinButton, startButton);

        const reply = await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

        async function draw() {
            let track = "";

            game.horses.forEach(horse => {
                horse.trackLine = game.trackLine(horse.position, horse.emoji);
                track += horse.trackLine + "\n";
            });

            embed.setDescription(track);

            await interaction.editReply({ embeds: [embed] });
        }

        await draw();

        async function tick() {
            // Move each horse

            game.horses.forEach(horse => {
                const random = randomInt(1, 2);

                if (random === 1) {
                    horse.position += 1;
                }
            });

            await draw();

            // check if any are at the end

            game.horses.forEach(horse => {
                if (horse.position === game.trackLength) game.winners.push(horse);
            });

            if (game.winners.length > 0) {
                clearInterval(game.tick);

                console.log("WINNER!!!!");
                console.log(`There is ${game.winners.length} winner. points will be multiplied by ${game.winners.length}`);

                game.winners.forEach(async (winner) => {
                    const pointsAwarded = (winner.pointsGambled * game.horses.length) / game.winners.length;
                    const account = await modifyPoints(winner.user, "+", pointsAwarded);

                    console.log(`${winner.user.displayName} wins ${pointsAwarded} points!`);
                });

                return;
            }
        }

        async function startRace() {
            await interaction.editReply({ components: [] });
            game.tick = setInterval(tick, 1000);
        }

        const buttonCollector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000
        });

        buttonCollector.on("collect", async (collected) => {
            //@ts-ignore
            if (collected.customId === joinButton.data.custom_id) {
                if (collected.user.id !== interaction.user.id)
                    //&& (!this.horses.find(horse => horse.user === collected.user)))
                {
                    await game.joinRace(collected.user, 50);
                    collected.deferUpdate();
                } else {
                    return;
                }
            }

            //@ts-ignore
            if (collected.customId === startButton.data.custom_id) {
                if (collected.user.id === interaction.user.id) {
                    await startRace();
                    collected.deferUpdate();
                } else {
                    return;
                }
            }
        });
    }

    private trackLine(position: number, emoji: string) {
        const startSegment = trackCharacter.repeat(position - 1);
        const endSegment = trackCharacter.repeat(this.trackLength - position);

        return startCharacter + startSegment + emoji + endSegment + endCharacter;
    }

    private async joinRace(user: User, points: number) {
        const account = await getAccount(user);

        const horse: Horse = {
            user,
            emoji: account.emoji,
            trackLine: this.trackLine(1, account.emoji),
            position: 1,
            pointsGambled: points
        };
        
        this.horses.push(horse);

        return horse;
    }
}