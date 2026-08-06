import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

import { getAccount } from "@/utils/account";

export class Info extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "info",
            description: "Shows you or someone else's info."
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("User to display info for")
                        .setRequired(false)
                ),
            {
                idHints: []
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();

        const inputTarget = interaction.options.getUser("user", false);

        let user = inputTarget ?? interaction.user;
        let account = await getAccount(inputTarget ? inputTarget : interaction.user);

        const fields = [
            `**Emoji**: ${account.emoji}`,
            `**Points**: ${account.points.toLocaleString()}`
        ];

        const embed = new EmbedBuilder()
            .setTitle(`${user.displayName}'s info:`)
            .setDescription(fields.join("\n"))
            .setThumbnail(user.avatarURL({ size: 256 }));

        return await interaction.editReply({
            embeds: [embed]
        });
    }
}