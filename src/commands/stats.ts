import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

import { getAccount } from "@/utils/accounts";
import { getEmojiByEmojiId, emojiToDiscordEmoji } from "@/utils/emojis";

export class Stats extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "stats",
            description: "Shows you or someone else's stats."
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
                        .setDescription("User to display stats for")
                        .setRequired(false)
                ),
            {
                idHints: ["1533542340252139552"]
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();

        let user = interaction.user;
        let account = interaction.account;

        const inputTarget = interaction.options.getUser("user", false);

        if ((inputTarget) && (inputTarget.id !== interaction.user.id)) {
            user = inputTarget;
            account = await getAccount(inputTarget);
        }

        const emoji = getEmojiByEmojiId(account.emojiId)!;

        const stats = `
            **Emoji**: ${emojiToDiscordEmoji(emoji)}
            **Points**: ${account.points.toLocaleString()}
        `;

        const embed = new EmbedBuilder()
            .setTitle(`${user.displayName}'s stats:`)
            .setDescription(stats)
            .setThumbnail(user.avatarURL({ size: 256 }));

        return await interaction.editReply({
            embeds: [embed]
        });
    }
}