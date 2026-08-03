import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    // identifiers
    id: serial().notNull().primaryKey(),
    discordId: varchar().notNull().unique(),

    // stats
    points: integer().notNull().default(0),

    // misc
    emoji: varchar().notNull().default("<:unrated:1533700573415739462>"),
    bot: boolean().notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow()
});