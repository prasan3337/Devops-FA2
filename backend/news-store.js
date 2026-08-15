import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'news.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB structure
const initialDb = {
  articles: [], // Array of news articles
  status: {
    lastSync: null,
    nextSync: null,
    status: 'idle',
    error: null,
    syncCount: 0
  }
};

/**
 * Reads the database file
 */
export function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialDb);
      return initialDb;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialDb;
  }
}

/**
 * Writes the database file
 */
export function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

/**
 * Extracts a high-quality image URL from an RSS item
 */
function extractImage(item) {
  // 1. Check enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }

  // 2. Check media:content (commonly parsed by rss-parser under various keys)
  const mediaContent = item['media:content'] || item['media:thumbnail'] || item['media:group'] || item['content:media'];
  if (mediaContent) {
    if (Array.isArray(mediaContent) && mediaContent.length > 0) {
      return mediaContent[0].$.url || mediaContent[0].url;
    } else if (mediaContent.$ && mediaContent.$.url) {
      return mediaContent.$.url;
    } else if (mediaContent.url) {
      return mediaContent.url;
    }
  }

  // 3. Search description for an <img> tag
  const description = item.description || item.content || '';
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = description.match(imgRegex);
  if (match && match[1]) {
    // Avoid small tracker pixels or emojis
    const src = match[1];
    if (!src.includes('feedburner') && !src.includes('pixel') && !src.includes('spinner')) {
      return src;
    }
  }

  // No image found
  return null;
}

/**
 * Cleans HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ') // normalize spaces
    .trim();
}

/**
 * Adds a batch of parsed articles to the store, performing deduplication and capping counts
 */
/**
 * Auto-categorizes an article based on its URL path structure if it was fetched from a general feed
 */
function detectCategory(link, feedCategory) {
  // If the feed is specifically designated for a topic, respect that
  if (feedCategory && feedCategory !== 'top-stories') {
    return feedCategory;
  }

  const url = link.toLowerCase();
  if (url.includes('/sports/') || url.includes('/sport/') || url.includes('/cricket/') || url.includes('/badminton/') || url.includes('/tennis/') || url.includes('/football/')) {
    return 'sports';
  }
  if (url.includes('/politics/') || url.includes('/national/') || url.includes('/india-news/') || url.includes('/india/') || url.includes('/governance/') || url.includes('/elections/')) {
    return 'politics';
  }
  if (url.includes('/entertainment/') || url.includes('/movies/') || url.includes('/showbiz/') || url.includes('/bollywood/') || url.includes('/hollywood/') || url.includes('/film/') || url.includes('/culture/') || url.includes('/lifestyle/')) {
    return 'entertainment';
  }
  if (url.includes('/business/') || url.includes('/economy/') || url.includes('/finance/') || url.includes('/money/') || url.includes('/market/') || url.includes('/markets/')) {
    return 'business';
  }
  if (url.includes('/world/') || url.includes('/international/') || url.includes('/foreign/')) {
    return 'international';
  }

  return 'top-stories';
}

/**
 * Adds a batch of parsed articles to the store, performing deduplication and capping counts
 */
export function addArticles(rawArticles, feedConfig) {
  const db = readDb();
  let addedCount = 0;

  for (const item of rawArticles) {
    // Unique identifier is GUID or Link
    const guid = item.guid || item.id || item.link;
    const link = item.link || '';
    
    if (!link) continue;

    const title = stripHtml(item.title || 'Untitled Article');
    const description = stripHtml(item.contentSnippet || item.summary || item.description || '');
    const image = extractImage(item);
    
    // Auto-categorize based on URL matching
    const category = detectCategory(link, feedConfig.category);

    // Check if article already exists
    const existingIndex = db.articles.findIndex(
      a => a.guid === guid || a.link === link || (a.title === title && a.source === feedConfig.name)
    );

    if (existingIndex !== -1) {
      const existingArticle = db.articles[existingIndex];
      
      // Upgrade existing top-stories article category to specific category if discovered in specific feed
      if (existingArticle.category === 'top-stories' && category !== 'top-stories') {
        existingArticle.category = category;
        console.log(`[Category Upgrade] "${title}" updated to "${category}"`);
      }
      
      // Update image if we found a new one
      if (!existingArticle.image && image) {
        existingArticle.image = image;
      }

      // Preserve isTopStorySource flags
      if (feedConfig.isTopStorySource) {
        existingArticle.isTopStorySource = true;
      }
      continue;
    }

    // Parse and normalize the date
    let pubDate = new Date();
    if (item.pubDate || item.isoDate || item.date) {
      const parsedDate = new Date(item.pubDate || item.isoDate || item.date);
      if (!isNaN(parsedDate.getTime())) {
        pubDate = parsedDate;
      }
    }

    // Exclude articles older than 3 days (3 * 24 * 60 * 60 * 1000 = 259,200,000 ms)
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - pubDate.getTime() > THREE_DAYS_MS) {
      continue;
    }

    const newArticle = {
      guid,
      title,
      link,
      description: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
      pubDate: pubDate.toISOString(),
      sourceId: feedConfig.id,
      source: feedConfig.name,
      category,
      region: feedConfig.region,
      isTopStorySource: feedConfig.isTopStorySource,
      image
    };

    db.articles.push(newArticle);
    addedCount++;
  }

  // Sort articles by publication date descending
  db.articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Cap articles per category-region combination to keep storage small and query fast
  // (We'll keep a maximum of 150 articles per category, and remove items older than 3 days)
  const categoryLimits = {};
  const cappedArticles = [];
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  for (const article of db.articles) {
    const ageMs = Date.now() - new Date(article.pubDate).getTime();
    if (ageMs > THREE_DAYS_MS) {
      continue;
    }
    const key = `${article.category}_${article.region}`;
    categoryLimits[key] = (categoryLimits[key] || 0) + 1;
    if (categoryLimits[key] <= 150) {
      cappedArticles.push(article);
    }
  }

  db.articles = cappedArticles;
  writeDb(db);

  return addedCount;
}

/**
 * Fetches queryable list of articles
 */
export function getArticles({ category, region, source, search, page = 1, limit = 20, importantOnly = false }) {
  const db = readDb();
  let filtered = [...db.articles];

  // 1. Filter by category
  // In 'top-stories', if a source is selected, display all articles from that source.
  // Otherwise, filter for top stories.
  if (category && category !== 'all' && category !== 'top-stories') {
    filtered = filtered.filter(a => a.category === category);
  } else if (category === 'top-stories') {
    if (source && source !== 'all') {
      // Show all articles from this source in the Top News feed
    } else {
      filtered = filtered.filter(a => a.isTopStorySource || a.category === 'top-stories');
    }
  }

  // 2. Filter by region
  if (region && region !== 'all') {
    filtered = filtered.filter(a => a.region.toLowerCase() === region.toLowerCase());
  }

  // 3. Filter by source (using clean newspaper name)
  if (source && source !== 'all') {
    filtered = filtered.filter(a => a.source === source);
  }

  // 4. Filter by important flag
  if (importantOnly) {
    filtered = filtered.filter(a => a.isTopStorySource || a.category === 'top-stories');
  }

  // 5. Search text filter
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      a => a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
    );
  }

  // Calculate pagination metadata
  let total = filtered.length;

  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedArticles = filtered.slice(startIndex, startIndex + limit);

  return {
    articles: paginatedArticles,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
}

/**
 * Returns list of unique sources currently in the database
 */
export function getSources() {
  const db = readDb();
  const sourcesMap = {};
  
  db.articles.forEach(a => {
    // Group by source name (newspaper brand) to ensure single entry per newspaper
    if (!sourcesMap[a.source]) {
      sourcesMap[a.source] = {
        id: a.source, // Use source name as ID for frontend filtering
        name: a.source,
        region: a.region
      };
    }
  });

  return Object.values(sourcesMap);
}

/**
 * Updates status of background syncer
 */
export function updateSyncStatus({ status, error = null, addedCount = 0 }) {
  const db = readDb();
  
  db.status = {
    lastSync: status === 'success' ? new Date().toISOString() : db.status.lastSync,
    nextSync: status === 'success' ? new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() : db.status.nextSync,
    status,
    error,
    syncCount: db.status.syncCount + (status === 'success' ? 1 : 0)
  };

  writeDb(db);
  return db.status;
}

/**
 * Returns current sync status
 */
export function getSyncStatus() {
  const db = readDb();
  return db.status;
}
