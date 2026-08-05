import { Command } from "@sapphire/framework";
import { ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ButtonInteraction } from "discord.js";

import { modifyPoints } from "@/utils/account";

interface Fishy {
    prefix: string,
    rarity: string,
    chance: number,
    points: number,
    emoji: string
}

const fishies: Fishy[] = [
    { prefix: "an", rarity: "unrated", chance: 40, points: 5, emoji: "<:unrated:1533700573415739462>" },
    { prefix: "an", rarity: "auto", chance: 30, points: 10, emoji: "<:auto:1533700565354152068>" },
    { prefix: "an", rarity: "easy", chance: 20, points: 25, emoji: "<:easy:1533700567057043536>" },
    { prefix: "a",  rarity: "normal", chance: 15, points: 50, emoji: "<:normal:1533700570962071732>" },
    { prefix: "a", rarity: "hard", chance: 10, points: 75, emoji: "<:hard:1533700567824597123>" },
    { prefix: "a", rarity: "harder", chance: 8, points: 100, emoji: "<:harder:1533700568755732500>" },
    { prefix: "an", rarity: "insane", chance: 6, points: 150, emoji: "<:insane:1533700569875878028>" },
    { prefix: "an", rarity: "easy demon", chance: 4, points: 250, emoji: "<:EasyDemon:1533570525903716362>" },
    { prefix: "a", rarity: "medium demon", chance: 3, points: 500, emoji: "<:MediumDemon:1533570531276755025>" },
    { prefix: "a", rarity: "hard demon", chance: 2, points: 750, emoji: "<:HardDemon:1533570528424755400>" },
    { prefix: "an", rarity: "insane demon", chance: 1, points: 1000, emoji: "<:InsaneDemon:1533570530182168788>" },
    { prefix: "an", rarity: "extreme demon", chance: 0.5, points: 2000, emoji: "<:ExtremeDemon:1533570526797234277>" },
    { prefix: "an", rarity: "INFINITE DEMON", chance: 0.01, points: 50000, emoji: "<:infinitedemon:1533697800095924244>" },
];

export class Fish extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "fish",
            description: "Go fishing!"
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
        this.fish(interaction);
    }

    private async fish(interaction: Command.ChatInputCommandInteraction | ButtonInteraction) {
        await interaction.deferReply();

        let fishedAgain = false;

        const fish = this.getRandomFish();

        const account = await modifyPoints(interaction.user, "+", fish.points);

        const againButton = new ButtonBuilder()
            .setCustomId("again")
            .setLabel("Fish again")
            .setEmoji("\u{1F501}")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(againButton);

        const reply = await interaction.editReply({
            content: `Caught ${fish.prefix} ${fish.rarity} fish ${fish.emoji}! ` +
            `(+${fish.points.toLocaleString()} points | total ${account.points.toLocaleString()} points)`,
            components: [row]
        });

        const buttonCollector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        buttonCollector.on("collect", async (collected) => {
            if (!fishedAgain) {
                fishedAgain = true;
            
                buttonCollector.stop();

                await interaction.editReply({ components: [] });

                this.fish(collected);

                return;
            }
        });
    }

    private getRandomFish() {
        let total = 0;

        for (const fish of fishies) { total += fish.chance }

        let random = Math.random() * total;

        for (const fish of fishies) {
            random -= fish.chance;

            if (random <= 0) {
                return fish;
            }
        }

        return fishies[fishies.length - 1];
    }
}