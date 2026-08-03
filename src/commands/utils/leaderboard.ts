import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags, TextChannel } from "discord.js";
import { desc } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/schema";

const delay = 30000;
let lastRunTime = 0;

export class Leaderboard extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "leaderboard",
            description: "Shows a ranking of who has the most points."
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description),
            {
                idHints: ["1533705148424126600"]
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const now = Date.now();

        if (now - lastRunTime >= delay) {
            lastRunTime = now;

            await interaction.guild?.members.fetch();

            let ranking = await db
                .select()
                .from(user)
                .orderBy(desc(user.points));

            ranking = ranking.filter(account =>
                account.bot !== true &&
                interaction.guild!.members.cache.has(account.discordId)
            );

            let rankingString = "";

            ranking.forEach((account, index) => {
                index = index + 1;
                rankingString += `**#${index}**: ${account.emoji} <@${account.discordId}> - ${account.points.toLocaleString()} points\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle(`Points leaderboard for ${interaction.guild?.name}`)
                .setDescription(rankingString);

            const channel = interaction.channel as TextChannel;

            await interaction.deleteReply().catch(e => {});
            await channel.send({ embeds: [embed] });
        } else {
            await interaction.editReply({ content: `You can run this command <t:${Math.round((lastRunTime + delay) / 1000)}:R>` });
        }
    }
}