import mongoose from 'mongoose';

// Define Article Schema
const articleSchema = new mongoose.Schema({
  guid: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  link: { type: String, required: true, index: true },
  description: { type: String },
  pubDate: { type: Date, required: true, index: true },
  sourceId: { type: String, required: true },
  source: { type: String, required: true },
  category: { type: String, required: true, index: true },
  region: { type: String, required: true, index: true },
  isTopStorySource: { type: Boolean, default: false },
  image: { type: String }
});

const Article = mongoose.model('Article', articleSchema);

// Define Sync Status Schema
const syncStatusSchema = new mongoose.Schema({
  lastSync: { type: Date },
  nextSync: { type: Date },
  status: { type: String, default: 'idle' },
  error: { type: String },
  syncCount: { type: Number, default: 0 }
});

const SyncStatus = mongoose.model('SyncStatus', syncStatusSchema);

/**
 * Extracts a high-quality image URL from an RSS item
 */
function extractImage(item) {
  // 1. Check enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }

  // 2. Check media:content
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
    const src = match[1];
    if (!src.includes('feedburner') && !src.includes('pixel') && !src.includes('spinner')) {
      return src;
    }
  }

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
 * Auto-categorizes an article based on its URL path structure if it was fetched from a general feed
 */
function detectCategory(link, feedCategory) {
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
export async function addArticles(rawArticles, feedConfig) {
  let addedCount = 0;

  for (const item of rawArticles) {
    const guid = item.guid || item.id || item.link;
    const link = item.link || '';
    
    if (!link) continue;

    const title = stripHtml(item.title || 'Untitled Article');
    const description = stripHtml(item.contentSnippet || item.summary || item.description || '');
    const image = extractImage(item);
    const category = detectCategory(link, feedConfig.category);

    // Check if article already exists (by guid, link, or same title+source)
    const article = await Article.findOne({
      $or: [
        { guid },
        { link },
        { title, source: feedConfig.name }
      ]
    });

    if (article) {
      let modified = false;
      
      // Upgrade category if it was classified as top-stories but is now specific
      if (article.category === 'top-stories' && category !== 'top-stories') {
        article.category = category;
        modified = true;
      }
      
      // Update image if none existed
      if (!article.image && image) {
        article.image = image;
        modified = true;
      }

      // Preserve top story flag
      if (feedConfig.isTopStorySource && !article.isTopStorySource) {
        article.isTopStorySource = true;
        modified = true;
      }

      if (modified) {
        await article.save();
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

    // Exclude articles older than 3 days
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - pubDate.getTime() > THREE_DAYS_MS) {
      continue;
    }

    const newArticle = new Article({
      guid,
      title,
      link,
      description: description.substring(0, 300) + (description.length > 300 ? '...' : ''),
      pubDate,
      sourceId: feedConfig.id,
      source: feedConfig.name,
      category,
      region: feedConfig.region,
      isTopStorySource: !!feedConfig.isTopStorySource,
      image
    });

    await newArticle.save();
    addedCount++;
  }

  // Prune articles older than 3 days to keep storage clean
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - THREE_DAYS_MS);
  await Article.deleteMany({ pubDate: { $lt: cutoffDate } });

  return addedCount;
}

/**
 * Fetches queryable list of articles from MongoDB
 */
export async function getArticles({ category, region, source, search, page = 1, limit = 20, importantOnly = false }) {
  const query = {};

  // 1. Filter by category
  if (category && category !== 'all' && category !== 'top-stories') {
    query.category = category;
  } else if (category === 'top-stories') {
    if (source && source !== 'all') {
      // If a source is specified in top-stories, show all from that source
    } else {
      query.$or = [
        { isTopStorySource: true },
        { category: 'top-stories' }
      ];
    }
  }

  // 2. Filter by region
  if (region && region !== 'all') {
    query.region = new RegExp(`^${region}$`, 'i');
  }

  // 3. Filter by source
  if (source && source !== 'all') {
    query.source = source;
  }

  // 4. Filter by important flag
  if (importantOnly) {
    if (query.$or) {
      // already setup above
    } else {
      query.$or = [
        { isTopStorySource: true },
        { category: 'top-stories' }
      ];
    }
  }

  // 5. Search text filter (fuzzy match)
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    if (!query.$and) query.$and = [];
    query.$and.push({
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    });
  }

  const total = await Article.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;

  const articles = await Article.find(query)
    .sort({ pubDate: -1 })
    .skip(startIndex)
    .limit(limit);

  return {
    articles,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
}

/**
 * Returns list of unique sources currently in the database using aggregation
 */
export async function getSources() {
  try {
    const results = await Article.aggregate([
      {
        $group: {
          _id: '$source',
          name: { $first: '$source' },
          region: { $first: '$region' }
        }
      },
      {
        $project: {
          _id: 0,
          id: '$name',
          name: 1,
          region: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    return results;
  } catch (err) {
    console.error('Error fetching distinct sources from aggregation:', err);
    return [];
  }
}

/**
 * Updates status of background syncer in MongoDB
 */
export async function updateSyncStatus({ status, error = null, addedCount = 0 }) {
  try {
    let doc = await SyncStatus.findOne();
    if (!doc) {
      doc = new SyncStatus();
    }

    if (status === 'success') {
      doc.lastSync = new Date();
      doc.nextSync = new Date(Date.now() + 3 * 60 * 60 * 1000);
      doc.syncCount += 1;
    }
    doc.status = status;
    doc.error = error;

    await doc.save();
    return doc;
  } catch (err) {
    console.error('Error updating sync status:', err);
    return { status, error, syncCount: 0 };
  }
}

/**
 * Returns current sync status
 */
export async function getSyncStatus() {
  try {
    let doc = await SyncStatus.findOne();
    if (!doc) {
      doc = new SyncStatus();
      await doc.save();
    }
    return doc;
  } catch (err) {
    console.error('Error fetching sync status:', err);
    return {
      lastSync: null,
      nextSync: null,
      status: 'idle',
      error: err.message,
      syncCount: 0
    };
  }
}
