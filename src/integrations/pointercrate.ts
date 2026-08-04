import { ListIntegration } from "@/classes/listIntegration";

interface User {
    name: string
}

interface Level {
    name: string,
    level_id: number,
    position: number,
    publisher: User,
    verifier: User
}

export class PointercrateIntegration extends ListIntegration {
    api = "https://pointercrate.com/api/v2/demons/listed";

    override async updateList() {
        const segment1 = await (await fetch(this.api + "?limit=100")).json() as Level[];
        const segment2 = await (await fetch(this.api + "?after=100")).json() as Level[];

        const combined = segment1.concat(segment2);

        combined.forEach(level => {
            this.list.push({
                name: level.name,
                level_id: level.level_id,
                position: level.position,
                publisher: level.publisher.name,
                verifier: level.verifier.name
            });
        });
    }
}