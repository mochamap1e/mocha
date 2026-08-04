import { Command } from "@sapphire/framework";
import { PaginatedMessage } from "@sapphire/discord.js-utilities";
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
                idHints: []
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();

        const now = Date.now();

        if (now - lastRunTime >= delay) {
            lastRunTime = now;

            const message = new PaginatedMessage();
            const usersPerPage = 10;

            await interaction.guild?.members.fetch();

            let ranking = await db
                .select()
                .from(user)
                .orderBy(desc(user.points));

            ranking = ranking.filter(account =>
                account.bot !== true &&
                interaction.guild!.members.cache.has(account.discordId)
            );

            for (let i = 0; i < ranking.length; i += usersPerPage) {
                const section = ranking.slice(i, i + usersPerPage);

                let pageString = "";

                section.forEach((account, index) => {
                    index = index + 1;
                    pageString += `**#${index}**: ${account.emoji} <@${account.discordId}> - ${account.points.toLocaleString()} points\n`;
                });

                message.addPageEmbed(embed => 
                    embed.setTitle(`Points leaderboard for ${interaction.guild?.name}`)
                    .setDescription(pageString)
                )
            }

            await message.run(interaction);
        } else {
            await interaction.editReply({ content: `You can run this command <t:${Math.round((lastRunTime + delay) / 1000)}:R>` });
        }
    }
}