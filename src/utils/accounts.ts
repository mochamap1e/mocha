import { db } from "@/db/client";
import { emojis } from "@/utils/emojis";
import type { User } from "discord.js";

const database = await db();

export async function getAccount(user: User) {
    const account = await database.findOneAndUpdate(
        { discordId: user.id },
        {
            $setOnInsert: {
                bot: user.bot,
                discordId: user.id,
                emojiId: emojis[0]?.emojiId,
                points: 0
            }
        },
        {
            upsert: true,
            returnDocument: "after"
        }
    );

    if (!account) {
        throw new Error(`Failed to get account id ${user.id}`);
    }

    return account;
}