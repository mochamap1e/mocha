const api = "https://pointercrate.com/api/v2/demons/listed";

interface User {
    id: number,
    name: string,
    banned: false
}

interface Level {
    id: number,
    position: number,
    name: string,
    requirement: number,
    video: string,
    thumbnail: string,
    publisher: User,
    verifier: User,
    level_id: number
}

let list: Level[] | null = null;

async function updateList() {
    try {
        const firstHalf = await (await fetch(api + "?limit=100")).json() as Level[];
        const secondHalf = await (await fetch(api + "?after=100")).json() as Level[];

        list = firstHalf.concat(secondHalf);

        console.log("Updated Pointercrate list");
    } catch(error) {
        console.error("Failed to update Pointercrate list:", error);
        return;
    }
}

export function getList() { return list; }

updateList();
setInterval(updateList, 86400000); // refresh list every day