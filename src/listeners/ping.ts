import { Listener, Events } from "@sapphire/framework";
import { Message, MessageType, TextChannel } from "discord.js";
import { randomInt } from "mathjs";

const messages = [
    "yo",
    "hi",
    "hey",
    "hello",
    "wassup",
    "sup"
];

export class PingListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.MessageCreate
        });
    }

    public async run(message: Message) {
        if (message.author.bot) return;
        if (message.type === MessageType.Reply) return;

        if (message.mentions.has(this.container.client.user)) {
            const channel = message.channel as TextChannel;
            
            return await channel.send(messages[randomInt(0, messages.length)]);
        }
    }
}