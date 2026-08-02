import { GatewayIntentBits } from "discord.js";
import { SapphireClient } from "@sapphire/framework";

export const token = process.env.TOKEN; if (!token) throw new Error("TOKEN must be provided in .env!");

const client = new SapphireClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    loadMessageCommandListeners: true,
    defaultPrefix: ","
});

client.login(token);