import { Listener, Events } from "@sapphire/framework";

import { whitelist } from "@/utils/whitelist";

export class PingListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.ClientReady
        });
    }

    public async run() {
        await this.container.client.guilds.fetch();

        this.container.client.guilds.cache.forEach(async (server) => {
            console.log(`[SERVER]: ${server.name} | ${server.id}`);

            if (!whitelist.includes(server.id)) {
                await server.leave();
                console.log(`Left unwhitelisted server ${server.name}`);
            }
        });
    }
}