import { randomInt } from "mathjs";

export abstract class ListIntegration {
    protected list: ListLevel[] = [];
    protected abstract api: string;

    public getList() {
        return this.list;
    };

    public async getRandomLevel(): Promise<ListLevel> {
        return this.list[randomInt(0, this.list.length)];
    }

    public abstract updateList(): Promise<void>;
}