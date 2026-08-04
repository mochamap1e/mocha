import { Command } from "@sapphire/framework";
import { randomInt } from "mathjs";

export class Fish extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: "fish",
            description: "Go fishing!"
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
        
    }
}