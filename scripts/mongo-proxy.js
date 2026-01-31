import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbService } from '../src/lib/db.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB connection
dbService.connect().catch(err => {
  console.error('[mongo-proxy] Failed to connect to DB', err);
});

app.post('/api/db/:collection/:action', async (req, res) => {
  const { collection, action } = req.params;
  const body = req.body;

  try {
    const coll = dbService.getCollection(collection);
    let result;

    switch (action) {
      case 'find':
        result = await coll.find(body.filter || {}).sort(body.sort || {}).limit(body.limit || 0).toArray();
        res.json({ documents: result });
        break;
      case 'findOne':
        result = await coll.findOne(body.filter || {});
        res.json({ document: result });
        break;
      case 'insertOne':
        result = await coll.insertOne(body.document);
        res.json({ insertedId: result.insertedId });
        break;
      case 'updateOne':
        result = await coll.updateOne(body.filter, body.update, { upsert: body.upsert });
        res.json(result);
        break;
      default:
        res.status(400).json({ error: `Unsupported action: ${action}` });
    }
  } catch (error) {
    console.error(`[mongo-proxy] Error in ${action} on ${collection}:`, error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.MONGODB_PROXY_PORT || 5179;
app.listen(port, () => console.log(`[mongo-proxy] listening on http://localhost:${port}`));
