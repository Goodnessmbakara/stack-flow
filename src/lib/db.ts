import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || "";

export class DatabaseService {
  private static instance: DatabaseService;
  private client: MongoClient;
  private dbName: string;

  private constructor() {
    this.dbName = process.env.VITE_MONGODB_DATABASE || 'stackflow';
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect() {
    try {
      await this.client.connect();
      await this.client.db("admin").command({ ping: 1 });
      console.log("[DatabaseService] Connected successfully to MongoDB Atlas");
    } catch (error) {
      console.error("[DatabaseService] Connection error:", error);
      throw error;
    }
  }

  getDb() {
    return this.client.db(this.dbName);
  }

  getCollection(name: string) {
    return this.getDb().collection(name);
  }

  async close() {
    await this.client.close();
  }
}

export const dbService = DatabaseService.getInstance();
export default dbService;
