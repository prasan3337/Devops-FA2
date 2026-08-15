import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124'
  }
});

async function testGNews() {
  const url = 'https://news.google.com/rss/search?q=when:24h+source:CNN&hl=en-US&gl=US&ceid=US:en';
  try {
    console.log(`Fetching GNews search for CNN: ${url}`);
    const feed = await parser.parseURL(url);
    console.log(`Title: ${feed.title}`);
    console.log(`Total items: ${feed.items.length}`);
    if (feed.items.length > 0) {
      console.log('Sample items (should be current 2026/recent):');
      feed.items.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i + 1}. Title: ${item.title}`);
        console.log(`     Link: ${item.link}`);
        console.log(`     PubDate: ${item.pubDate} (parsed: ${new Date(item.pubDate).toISOString()})`);
      });
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

testGNews();
