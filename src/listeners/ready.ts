import { Listener, Events } from "@sapphire/framework";

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

        this.container.client.guilds.cache.forEach(server => {
            console.log(`[SERVER]: ${server.name} | ${server.id}`);
        });
    }
}