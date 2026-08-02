import { Time } from "@sapphire/time-utilities";

const api = "https://pointercrate.com/api/v2/demons/listed";

let list: PointercrateLevel[] | null = null;

async function updateList() {
    try {
        const firstHalf = await (await fetch(api + "?limit=100")).json() as PointercrateLevel[];
        const secondHalf = await (await fetch(api + "?after=100")).json() as PointercrateLevel[];

        list = firstHalf.concat(secondHalf);

        console.log("Updated Pointercrate list");
    } catch(error) {
        console.error("Failed to update Pointercrate list:", error);
        return;
    }
}

export function getList() { return list; }

updateList();
setInterval(updateList, Time.Day); // refresh list every day