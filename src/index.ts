import { GatewayIntentBits } from "discord.js";
import { ApplicationCommandRegistries, RegisterBehavior, SapphireClient } from "@sapphire/framework";

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

export const token = process.env.TOKEN; if (!token) throw new Error("TOKEN must be provided in .env!");

const client = new SapphireClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.login(token);