import { AllFlowsPrecondition } from "@sapphire/framework";
import { Message, CommandInteraction, ContextMenuCommandInteraction } from "discord.js";

import { getAccount } from "@/utils/accounts";

export class AccountPrecondition extends AllFlowsPrecondition {
    public constructor(context: AllFlowsPrecondition.LoaderContext, options: AllFlowsPrecondition.Options) {
        super(context, {
            ...options,
            position: 1
        });
    }

    public override async messageRun(message: Message) {
        return this.check(message);
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        return this.check(interaction);
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        return this.check(interaction);
    }

    private async check(interaction: Message | CommandInteraction | ContextMenuCommandInteraction) {
        const user = interaction instanceof Message ? interaction.author : interaction.user;

        const account = await getAccount(user);

        Reflect.set(interaction, "account", account);

        return this.ok();
    }
}

declare module "discord.js" {
    interface CommandInteraction {
        account: DatabaseUser;
    }

    interface ContextMenuCommandInteraction {
        account: DatabaseUser;
    }

    interface Message {
        account: DatabaseUser;
    }
}