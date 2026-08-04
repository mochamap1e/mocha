import { Command } from "@sapphire/framework";
import { PaginatedMessage } from "@sapphire/discord.js-utilities";
import { MessageFlags } from "discord.js";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/schema";

export class Emojis extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "emojis",
            description: "Shows the available emojis."
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
        const message = new PaginatedMessage();
        const emojisPerPage = 10;

        message.setActions(PaginatedMessage.defaultActions.filter((action: any) =>
            action.customId === "@sapphire/paginated-messages.previousPage" ||
            action.customId === "@sapphire/paginated-messages.nextPage"
        ));

        const emojis = await this.container.client.application.emojis.fetch();
        const emojiArray = emojis.map(emoji => emoji.toString());

        for (let i = 0; i < emojiArray.length; i += emojisPerPage) {
            const section = emojiArray.slice(i, i + emojisPerPage);

            let pageString = "";

            section.forEach((emoji, index) => pageString += `${index + 1 + i}: ${emoji}\n`);
            
            message.addPageEmbed(embed =>
                embed.setTitle("Emojis")
                .setDescription(`Set your emoji with /set-emoji\n\n${pageString}`)
            );
        }

        await message.run(interaction);
    }
}

export class SetEmoji extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "set-emoji",
            description: "Set your current emoji."
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addIntegerOption(option =>
                    option
                        .setName("emoji")
                        .setDescription("The number of the emoji in the emojis list (/emojis)")
                        .setRequired(true)
                ),
            {
                idHints: []
            }
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const emojiNumber = interaction.options.getInteger("emoji", true);

        const emojis = await this.container.client.application.emojis.fetch();
        const emojiArray = emojis.map(emoji => emoji.toString());

        if ((emojiNumber > 0) && (emojiNumber <= emojis.size)) {
            const emoji = emojiArray[emojiNumber - 1];

            await db
                .update(user)
                .set({ emoji })
                .where(eq(user.discordId, interaction.user.id));

            return interaction.editReply({ content: `Your emoji is now ${emoji}` });
        } else {
            return interaction.editReply({ content: "Invalid emoji number!" });
        }
    }
}