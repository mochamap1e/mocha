import { Command } from "@sapphire/framework";
import { EmbedBuilder, ModalBuilder, TextInputBuilder, LabelBuilder, TextInputStyle, User } from "discord.js";
import { randomInt } from "mathjs";

import { getAccount } from "@/utils/account";

const minTrackLength = 20;
const maxTrackLength = 40;

const trackCharacter = "\\_";

interface Horse {
    emoji: string,
    position: number
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
            .setLabel("How many points do you want to gamble?")
            .setDescription("Input ONLY a number (example: 2000)")
            .setTextInputComponent(textInput);

        modal.addLabelComponents(inputLabel);

        await interaction.showModal(modal);
        */

        await interaction.deferReply();

        const game = this;
        const trackLength = interaction.options.getInteger("track-length", false) ?? minTrackLength;

        // SETUP

        let horses: Horse[] = [];
        let winners: Horse[] = [];

        const hostAccount = await getAccount(interaction.user);
        const hostHorse = game.createHorse(hostAccount.emoji);

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
            }

            interaction.editReply({ embeds: [embed] });
        }

        const tickInterval = setInterval(tick, 1000);

        return interaction.editReply({ embeds: [embed] });
    }

    private trackLine(length: number, position: number, horse: Horse) {
        const startSegment = trackCharacter.repeat(position - 1);
        const endSegment = trackCharacter.repeat(length - position);

        return startSegment + horse.emoji + endSegment;
    }

    private createHorse(emoji: string) {
        const horse: Horse = {
            emoji,
            position: 1
        };

        return horse;
    }
}