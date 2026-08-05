import { randomInt } from "mathjs";

export abstract class ListIntegration {
    protected list: ListLevel[] = [];
    protected abstract api: string;

    public getList() {
        return this.list;
    };

    public async getRandomLevel(limit?: number): Promise<ListLevel> {
        if ((!limit) || (limit >= this.list.length)) limit = this.list.length;
        
        return this.list[randomInt(0, limit)];
    }

    public abstract updateList(): Promise<void>;
}