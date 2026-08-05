import { Command } from "@sapphire/framework";
import { ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ButtonInteraction } from "discord.js";

import { modifyPoints } from "@/utils/account";

interface Fishy {
    prefix: string,
    rarity: string,
    chance: number,
    operator: string,
    points: number,
    emoji: string
}

const Operator = {
    Add: "+",
    Subtract: "-"
}

const fishies: Fishy[] = [
    { prefix: "a", rarity: "REALLY SAD", chance: 5, operator: Operator.Subtract, points: 500, emoji: "<a:cryingKitty:1534622612335099924>" },
    { prefix: "a", rarity: "sad", chance: 10, operator: Operator.Subtract, points: 100, emoji: "<:cryingeverywhere:1534622132733218978>" },
    { prefix: "a", rarity: "chopped", chance: 30, operator: Operator.Subtract, points: 25, emoji: "<:duuuughghhhhh:1533697799328235632>" },

    // Normal gd demons
    { prefix: "an", rarity: "unrated", chance: 40, operator: Operator.Add, points: 5, emoji: "<:unrated:1533700573415739462>" },
    { prefix: "an", rarity: "auto", chance: 30, operator: Operator.Add, points: 10, emoji: "<:auto:1533700565354152068>" },
    { prefix: "an", rarity: "easy", chance: 20, operator: Operator.Add, points: 25, emoji: "<:easy:1533700567057043536>" },
    { prefix: "a",  rarity: "normal", chance: 15, operator: Operator.Add, points: 50, emoji: "<:normal:1533700570962071732>" },
    { prefix: "a", rarity: "hard", chance: 10, operator: Operator.Add, points: 75, emoji: "<:hard:1533700567824597123>" },
    { prefix: "a", rarity: "harder", chance: 8, operator: Operator.Add, points: 100, emoji: "<:harder:1533700568755732500>" },
    { prefix: "an", rarity: "insane", chance: 6, operator: Operator.Add, points: 150, emoji: "<:insane:1533700569875878028>" },
    { prefix: "an", rarity: "easy demon", chance: 4, operator: Operator.Add, points: 250, emoji: "<:EasyDemon:1533570525903716362>" },
    { prefix: "a", rarity: "medium demon", chance: 3, operator: Operator.Add, points: 500, emoji: "<:MediumDemon:1533570531276755025>" },
    { prefix: "a", rarity: "hard demon", chance: 2, operator: Operator.Add, points: 750, emoji: "<:HardDemon:1533570528424755400>" },
    { prefix: "an", rarity: "insane demon", chance: 1, operator: Operator.Add, points: 1000, emoji: "<:InsaneDemon:1533570530182168788>" },
    { prefix: "an", rarity: "extreme demon", chance: 0.5, operator: Operator.Add, points: 2000, emoji: "<:ExtremeDemon:1533570526797234277>" },

    // other shit
    { prefix: "a", rarity: "silent diplomatic", chance: 0.1, operator: Operator.Add, points: 4291, emoji: "<:silentdiplomatic:1534622385486041088>" },
    { prefix: "an", rarity: "INFINITE DEMON", chance: 0.01, operator: Operator.Add, points: 100000, emoji: "<:infinitedemon:1533697800095924244>" },
];

const time = 30000;

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

        const account = await modifyPoints(interaction.user, fish.operator, fish.points);

        const againButton = new ButtonBuilder()
            .setCustomId("again")
            .setLabel("Fish again")
            .setEmoji("\u{1F501}")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(againButton);

        const reply = await interaction.editReply({
            content: `Caught ${fish.prefix} ${fish.rarity} fish ${fish.emoji}! ` +
            `(${fish.operator}${fish.points.toLocaleString()} points | total ${account.points.toLocaleString()} points)`,
            components: [row]
        });

        const buttonCollector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time });

        buttonCollector.on("collect", async (collected) => {
            if (!fishedAgain) {
                fishedAgain = true;
            
                buttonCollector.stop();

                await interaction.editReply({ components: [] });

                this.fish(collected);

                return;
            }
        });

        setTimeout(() => { if (!fishedAgain) interaction.editReply({ components: [] }) }, time);
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