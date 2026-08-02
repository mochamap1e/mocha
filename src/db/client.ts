import { MongoClient, Collection } from "mongodb";

const uri = process.env.MONGO_URI; if (!uri) throw new Error("MONGO_URI must be provided in .env");

const client = new MongoClient(uri);

let collection: Collection<DatabaseUser>;

export async function db() {
    if (collection) return collection;

    try {
        await client.connect();
        
        collection = client.db().collection<DatabaseUser>("users");

        return collection;
    } catch(error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
}