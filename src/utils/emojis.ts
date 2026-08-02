let emojis: Emoji[] = [
    { name: "FreeDemon", emojiId: "1533570527631769630", animated: false },
    { name: "PeacefulDemon", emojiId: "1533570535651541142", animated: false },
    { name: "SimpleDemon", emojiId: "1533570536511111198", animated: false },
    { name: "EasyDemon", emojiId: "1533570525903716362", animated: false },
    { name: "CasualDemon", emojiId: "1533570523508904210", animated: false },
    { name: "MildDemon", emojiId: "1533570531998302410", animated: false },
    { name: "MediumDemon", emojiId: "1533570531276755025", animated: false },
    { name: "NormalDemon", emojiId: "1533570534955286741", animated: false },
    { name: "ModerateDemon", emojiId: "1533570533067587675", animated: false },
    { name: "TrickyDemon", emojiId: "1533570538293825628", animated: false },
    { name: "HardDemon", emojiId: "1533570528424755400", animated: false },
    { name: "HarderDemon", emojiId: "1533570529150238840", animated: false },
    { name: "ToughDemon", emojiId: "1533570537463480390", animated: false },
    { name: "WildDemon", emojiId: "1533570539191406693", animated: false },
    { name: "InsaneDemon", emojiId: "1533570530182168788", animated: false },
    { name: "CruelDemon", emojiId: "1533570525043888319", animated: false },
    { name: "CrazyDemon", emojiId: "1533570524163215530", animated: false },
    { name: "BizarreDemon", emojiId: "1533570521390780516", animated: false },
    { name: "BrutalDemon", emojiId: "1533570522388889770", animated: false },
    { name: "ExtremeDemon", emojiId: "1533570526797234277", animated: false },
    { name: "FUK", emojiId: "1533604007384453220", animated: true }
];

emojis.forEach((_, index) => emojis[index]!.id = index+1);

export { emojis };

export function getEmojiById(id: number) { return emojis.find(emoji => emoji.id === id); }
export function getEmojiByEmojiId(id: string) { return emojis.find(emoji => emoji.emojiId === id); }
export function emojiToDiscordEmoji(emoji: Emoji) { return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.emojiId}>`; }