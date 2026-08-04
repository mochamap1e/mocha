import { GatewayIntentBits } from "discord.js";
import { SapphireClient, Events } from "@sapphire/framework";

import "@/utils/lists";

export const token = process.env.TOKEN; if (!token) throw new Error("TOKEN must be provided in .env!");

const wipeCommands = false;

const client = new SapphireClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

if (wipeCommands) {
    client.once(Events.ClientReady, async () => {
        await client.application?.commands.set([]);
        console.log("Wiped all commands.");
    });
}

await client.login(token);

console.log(`Logged into Discord as ${client.user.displayName}`);