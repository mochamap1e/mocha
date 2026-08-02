interface AREDL_Level {
    id: string
    name: string
    position: number
    publisher_id: string
    points: number
    legacy: boolean
    level_id: number
    two_player: boolean
    tags: string[]
    description: string
    song: number | null
    edel_enjoyment: number | null
    is_edel_pending: boolean
    gddl_tier: number
    nlw_tier: string | null
}

interface Emoji {
    id?: number,
    name: string,
    emojiId: string,
    animated: boolean
}

interface DatabaseUser {
    bot: boolean,
    discordId: string,
    emojiId: string,
    points: number
}

interface PointercrateUser {
    id: number,
    name: string,
    banned: false
}

interface PointercrateLevel {
    id: number,
    position: number,
    name: string,
    requirement: number,
    video: string,
    thumbnail: string,
    publisher: PointercrateUser,
    verifier: PointercrateUser,
    level_id: number
}