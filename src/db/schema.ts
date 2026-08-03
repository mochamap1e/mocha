import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

import { emojis } from "@/utils/emoji";

export const user = pgTable("user", {
    // identifiers
    id: serial().notNull().primaryKey(),
    discordId: varchar().notNull().unique(),

    // stats
    points: integer().notNull().default(0),

    // misc
    emoji: varchar().notNull().default(emojis[0]!.emojiId),
    bot: boolean().notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow()
});