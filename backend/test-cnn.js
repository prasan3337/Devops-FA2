import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124'
  }
});

async function testCNN() {
  const feeds = [
    'http://rss.cnn.com/rss/cnn_topstories.rss',
    'http://rss.cnn.com/rss/cnn_world.rss',
    'http://rss.cnn.com/rss/edition_entertainment.rss'
  ];

  for (const url of feeds) {
    try {
      console.log(`\nFetching ${url}...`);
      const feed = await parser.parseURL(url);
      console.log(`Title: ${feed.title}`);
      console.log(`Total items: ${feed.items.length}`);
      if (feed.items.length > 0) {
        console.log('Sample items:');
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
}

testCNN();
