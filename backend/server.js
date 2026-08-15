import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import mongoose from 'mongoose';
import { SOURCES } from './sources.js';
import {
  addArticles,
  getArticles,
  getSources,
  updateSyncStatus,
  getSyncStatus
} from './news-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI environment variable is missing!');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  timeout: 10000 // 10s timeout per feed
});

// Flag to prevent overlapping sync operations
let isSyncing = false;

/**
 * Scrapes all configured feeds, parses them, and stores the news in MongoDB
 */
async function syncFeeds() {
  if (isSyncing) {
    console.log('Sync already in progress. Skipping...');
    return { success: false, error: 'Sync already in progress' };
  }

  isSyncing = true;
  console.log(`[${new Date().toISOString()}] Starting news synchronization...`);
  await updateSyncStatus({ status: 'syncing' });

  let totalAdded = 0;
  const errors = [];

  // Scrape feeds in batches of 5 to manage network performance
  const chunkSize = 5;
  for (let i = 0; i < SOURCES.length; i += chunkSize) {
    const chunk = SOURCES.slice(i, i + chunkSize);
    const promises = chunk.map(async (source) => {
      try {
        console.log(`Fetching feed: ${source.name} (${source.category} - ${source.region}) - ${source.url}`);
        const feed = await parser.parseURL(source.url);
        if (feed && feed.items) {
          const added = await addArticles(feed.items, source);
          totalAdded += added;
          console.log(`Finished ${source.name}: Added ${added} new articles.`);
        }
      } catch (err) {
        console.error(`Error scraping feed ${source.name} (${source.url}):`, err.message);
        errors.push({ source: source.name, url: source.url, error: err.message });
      }
    });

    await Promise.all(promises);
  }

  const statusResult = await updateSyncStatus({
    status: 'success',
    addedCount: totalAdded,
    error: errors.length > 0 ? `${errors.length} feeds failed to sync` : null
  });

  isSyncing = false;
  console.log(`[${new Date().toISOString()}] Sync completed. Total new articles added: ${totalAdded}. Errors: ${errors.length}`);
  return { success: true, addedCount: totalAdded, status: statusResult, errors };
}

// 3-Hour Sync Interval
const SYNC_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in ms
setInterval(() => {
  console.log('Scheduled feed sync triggered...');
  syncFeeds();
}, SYNC_INTERVAL);

// === API ROUTES ===

// Get news articles from MongoDB
app.get('/api/news', async (req, res) => {
  const { category, region, source, search, page, limit, importantOnly } = req.query;

  try {
    const data = await getArticles({
      category: category || 'all',
      region: region || 'all',
      source: source || 'all',
      search: search || '',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      importantOnly: importantOnly === 'true'
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get configured/known news sources
app.get('/api/sources', async (req, res) => {
  try {
    const sources = await getSources();
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current scraper sync status
app.get('/api/status', async (req, res) => {
  try {
    const status = await getSyncStatus();
    const statusObj = status.toObject ? status.toObject() : status;
    res.json({
      ...statusObj,
      isSyncing
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual trigger sync
app.post('/api/trigger-sync', async (req, res) => {
  if (isSyncing) {
    return res.status(409).json({ error: 'Sync already in progress' });
  }
  
  try {
    const result = await syncFeeds();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// For React Router single page navigation support
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Connect to MongoDB Atlas first, then start Express Server
console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      
      // Proactively run the first synchronization on start
      console.log('Performing initial sync...');
      syncFeeds();
    });
  })
  .catch(err => {
    console.error('CRITICAL: Database connection failed. Server shutting down...', err.message);
    process.exit(1);
  });
