import { eq, sql } from "drizzle-orm";
import type { User } from "discord.js";

import { db } from "@/db/client";
import { user } from "@/db/schema";

export async function getAccount(targetUser: User) {
    const [account] = await db
        .select()
        .from(user)
        .where(eq(user.discordId, targetUser.id));

    if (account) {
        return account;
    }

    const [createdAccount] = await db
        .insert(user)
        .values({
            discordId: targetUser.id,
            bot: targetUser.bot
        })
        .returning();

    return createdAccount;
}

export async function modifyPoints(targetUser: User, operator: string, points: number) {
    await getAccount(targetUser);

    const [account] = await db
        .update(user)
        .set({
            points: sql`${user.points} ${sql.raw(operator)} ${points}`
        })
        .where(eq(user.discordId, targetUser.id))
        .returning();

    return account;
}