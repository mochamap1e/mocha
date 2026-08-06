import { Listener, Events } from "@sapphire/framework";

import { whitelist } from "@/utils/whitelist";

const wipeCommands = false;

export class PingListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ClientReady
        });
    }

    public async run() {
        if (wipeCommands) {
            await this.container.client.application.commands.set([]);
            console.log("Wiped all commands.");
        }

        await this.container.client.guilds.fetch();

        this.container.client.guilds.cache.forEach(async (server) => {
            if (!whitelist.includes(server.id)) {
                await server.leave();
                console.log(`Left unwhitelisted server ${server.name}`);
            }
        });
    }
}