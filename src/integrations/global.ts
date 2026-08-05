import { ListIntegration } from "@/classes/listIntegration";

interface Level {
    name: string,
    ingame_id: number,
    placement: number,
    holder: string,
    verifier: { username: string }
}

export class GlobalIntegration extends ListIntegration {
    api = "https://api.demonlist.org/level/classic/list?limit=2500";

    override async updateList() {
        const response = await (await fetch(this.api)).json() as any;
        const data = response.data.levels as Level[];

        data.forEach(level => {
            this.list.push({
                name: level.name,
                level_id: level.ingame_id,
                position: level.placement,
                publisher: level.holder,
                verifier: level.verifier.username
            })
        });
    }
}