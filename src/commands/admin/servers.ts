import { Command } from "@sapphire/framework";
import { Message, TextChannel, EmbedBuilder } from "discord.js";

export class Server extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "servers",
            description: "Shows you or someone else's info."
        });
    }

    override async messageRun(message: Message) {
        const application = await this.container.client.application.fetch();

        const channel = message.channel as TextChannel;

        if (message.author.id === application.owner.id) {
            await this.container.client.guilds.fetch();
            const servers = this.container.client.guilds.cache;

            const embed = new EmbedBuilder()
                .setTitle("Server List");

            let list = "";

            servers.forEach(server => {
                list += `**${server.name} (${server.id})**: \n\n` +
                `**Owner**: ${server.ownerId}\n` +
                `**Member count**: ${server.memberCount}\n` +
                `**Joined at**: ${server.joinedAt.toLocaleString()}\n\n`
            });

            embed.setDescription(list);

            return await channel.send({ embeds: [embed] });
        }
    }
}