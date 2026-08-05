import { randomInt } from "mathjs";

import { ListIntegration } from "@/classes/listIntegration";

interface User {
    global_name: string
}

interface Level {
    name: string,
    level_id: number,
    position: number,
    publisher: User,
    verifications: { submitted_by: User }[]
}

// add unrated

export class AREDLIntegration extends ListIntegration {
    api = "https://api.aredl.net/v2/api/aredl/levels/";

    override async updateList() {
        const response = await (await fetch(this.api)).json() as Level[];

        response.forEach(level => {
            this.list.push({
                name: level.name,
                level_id: level.level_id,
                position: level.position
            })
        });
    }

    override async getRandomLevel(limit?: number) {
        if ((!limit) || (limit >= this.list.length)) limit = this.list.length;
        
        const level = this.list[randomInt(0, limit)];
        const response = await (await fetch(this.api + level.level_id)).json() as Level;

        const data: ListLevel = {
            name: level.name,
            level_id: level.level_id,
            position: level.position,
            publisher: response.publisher.global_name,
            verifier: response.verifications[0].submitted_by.global_name
        };

        return data;
    }
}