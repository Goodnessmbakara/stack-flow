/**
 * MongoDB Client for Whale Tracking
 * Connects to MongoDB Atlas for storing whale data
 */

// MongoDB Data API configuration
// Using Data API for browser compatibility (no native driver needed)
const MONGODB_DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL || '';
const MONGODB_API_KEY = import.meta.env.VITE_MONGODB_API_KEY || '';
const MONGODB_DATA_SOURCE = import.meta.env.VITE_MONGODB_DATA_SOURCE || 'Cluster0';
const MONGODB_DATABASE = import.meta.env.VITE_MONGODB_DATABASE || 'stackflow';
const MONGODB_PROXY_URL = import.meta.env.VITE_MONGODB_PROXY_URL || 'http://localhost:5179';

export interface MongoDBConfig {
  apiUrl: string;
  apiKey: string;
  dataSource: string;
  database: string;
}

function getConfig(): MongoDBConfig {
  return {
    apiUrl: MONGODB_DATA_API_URL,
    apiKey: MONGODB_API_KEY,
    dataSource: MONGODB_DATA_SOURCE,
    database: MONGODB_DATABASE,
  };
}

/**
 * MongoDB Data API Client
 * Works in browser without native driver
 */
class MongoDBClient {
  private config: MongoDBConfig;

  constructor() {
    this.config = getConfig();
  }

  get isConfigured(): boolean {
    return !!(this.config.apiUrl && this.config.apiKey);
  }

  private async request(action: string, body: Record<string, unknown>) {
    // If proxy URL is available and enabled, use it
    if (MONGODB_PROXY_URL && !MONGODB_DATA_API_URL) {
      try {
        const response = await fetch(`${MONGODB_PROXY_URL}/api/db/${body.collection}/${action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (response.ok) return response.json();
      } catch (e) {
        console.warn('[MongoDB] Proxy failed, falling back to Data API or mock', e);
      }
    }

    if (!this.isConfigured) {
      console.warn('[MongoDB] Not configured - using mock data');
      return null;
    }

    const response = await fetch(`${this.config.apiUrl}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        dataSource: this.config.dataSource,
        database: this.config.database,
        ...body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[MongoDB] API Error:', error);
      throw new Error(`MongoDB API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Find documents in a collection
   */
  async find(collection: string, filter: Record<string, unknown> = {}, options: {
    sort?: Record<string, number>;
    limit?: number;
    projection?: Record<string, number>;
  } = {}) {
    const result = await this.request('find', {
      collection,
      filter,
      ...options,
    });
    return result?.documents || [];
  }

  /**
   * Find one document
   */
  async findOne(collection: string, filter: Record<string, unknown>) {
    const result = await this.request('findOne', {
      collection,
      filter,
    });
    return result?.document || null;
  }

  /**
   * Insert one document
   */
  async insertOne(collection: string, document: Record<string, unknown>) {
    const result = await this.request('insertOne', {
      collection,
      document: {
        ...document,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return result?.insertedId;
  }

  /**
   * Update one document (upsert supported)
   */
  async updateOne(
    collection: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    upsert = false
  ) {
    const result = await this.request('updateOne', {
      collection,
      filter,
      update: {
        $set: {
          ...update,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        },
      },
      upsert,
    });
    return result;
  }

  /**
   * Delete one document
   */
  async deleteOne(collection: string, filter: Record<string, unknown>) {
    const result = await this.request('deleteOne', {
      collection,
      filter,
    });
    return result?.deletedCount;
  }

  /**
   * Aggregate pipeline
   */
  async aggregate(collection: string, pipeline: Record<string, unknown>[]) {
    const result = await this.request('aggregate', {
      collection,
      pipeline,
    });
    return result?.documents || [];
  }
}

// Export singleton
export const mongoClient = new MongoDBClient();
export default mongoClient;
