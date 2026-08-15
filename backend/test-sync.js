import Parser from 'rss-parser';
import { SOURCES } from './sources.js';
import { addArticles, getArticles, readDb } from './news-store.js';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124'
  },
  timeout: 5000
});

async function runTest() {
  console.log('--- RSS Parse Verification Test ---');
  
  // Test a few specific feeds
  const testSources = [
    SOURCES.find(s => s.id === 'ndtv-top'), // India feed
    SOURCES.find(s => s.id === 'bbc-top'),  // Global feed
    SOURCES.find(s => s.id === 'cbs-sports') // Sports feed
  ].filter(Boolean);

  console.log(`Testing ${testSources.length} feeds...`);

  for (const source of testSources) {
    try {
      console.log(`\nTesting ${source.name} [${source.region}] (${source.category})`);
      console.log(`URL: ${source.url}`);
      
      const feed = await parser.parseURL(source.url);
      console.log(`Success! Feed Title: "${feed.title}"`);
      console.log(`Total items parsed: ${feed.items.length}`);
      
      if (feed.items.length > 0) {
        const item = feed.items[0];
        console.log(`First Article Sample:`);
        console.log(`  - Title: ${item.title}`);
        console.log(`  - Link: ${item.link}`);
        console.log(`  - Date: ${item.pubDate || item.isoDate || 'N/A'}`);
        
        // Add to database
        const added = addArticles([item], source);
        console.log(`  - Database Add Result: Added ${added} new articles`);
      }
    } catch (err) {
      console.error(`Failed to parse ${source.name}:`, err.message);
    }
  }

  // Check database file content length
  console.log('\n--- Reading Saved DB Results ---');
  const db = readDb();
  console.log(`Total articles in JSON DB: ${db.articles.length}`);
  
  const query = getArticles({ limit: 5 });
  console.log(`Querying top 5 articles:`);
  query.articles.forEach((a, i) => {
    console.log(`${i+1}. [${a.region}] ${a.source} (${a.category}): "${a.title}"`);
    console.log(`   Image found: ${a.image ? 'Yes' : 'No'} (${a.image || ''})`);
  });
  
  console.log('\nTest execution finished.');
}

runTest();
