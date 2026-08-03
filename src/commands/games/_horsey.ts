import { Command } from "@sapphire/framework";
import { EmbedBuilder, ModalBuilder, TextInputBuilder, LabelBuilder, TextInputStyle, User } from "discord.js";
import { randomInt } from "mathjs";

import { getAccount } from "@/utils/account";

const minTrackLength = 20;
const maxTrackLength = 40;

const trackCharacter = "\\_";
const startCharacter = "[";
const endCharacter = "]";

const pointsLabel = "How many points do you want to gamble?";
const minGamble = 10;

interface Horse {
    userId: string,
    emoji: string,
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
        const trackLength = interaction.options.getInteger("track-length", false) ?? minTrackLength;

        // SETUP

        let horses: Horse[] = [];
        let winners: Horse[] = [];

        const hostAccount = await getAccount(interaction.user);
        const hostHorse = await this.joinRace(interaction.user, 50);

        if (hostGamble > hostAccount.points) {
            interaction.editReply(`You cannot gamble more points than you have! You have ${hostAccount.points} points.`);
            return;
        }

        horses.push(hostHorse);

        const track1 = game.trackLine(trackLength, 1, hostHorse);

        const text = `${track1}`;

        const embed = new EmbedBuilder()
            .setTitle("Horse race!")
            .setDescription(text);

        function tick() {
            // Move each horse

            horses.forEach(horse => {
                const random = randomInt(1, 2);

                if (random === 1) {
                    horse.position += 1;
                }

                embed.setDescription(game.trackLine(trackLength, horse.position, horse));
            });

            // check if any are at the end

            horses.forEach(horse => {
                if (horse.position === trackLength) winners.push(horse);
            });

            if (winners.length > 0) {
                clearInterval(tickInterval);
                console.log("WINNER!!!!");
                
                console.log(`There is ${winners.length} winner. points will be multiplied by ${winners.length}`);

                winners.forEach(winner => {
                    const pointsAwarded = (winner.pointsGambled * horses.length) / winners.length;

                    console.log(`${winner.userId} wins ${pointsAwarded} points!`);
                });
            }

            interaction.editReply({ embeds: [embed] });
        }

        function startRace() {
            const tickInterval = setInterval(tick, 1000);
        }

        return interaction.editReply({ embeds: [embed] });
    }

    private trackLine(length: number, position: number, horse: Horse) {
        const startSegment = trackCharacter.repeat(position - 1);
        const endSegment = trackCharacter.repeat(length - position);

        return startCharacter + startSegment + horse.emoji + endSegment + endCharacter;
    }

    private async joinRace(user: User, points: number) {
        const account = await getAccount(user);

        const horse: Horse = {
            userId: account.discordId,
            emoji: account.emoji,
            position: 1,
            pointsGambled: points
        };

        return horse;
    }
}