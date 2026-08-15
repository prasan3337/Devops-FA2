import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124'
  }
});

async function testIE() {
  const feeds = [
    'https://indianexpress.com/feed/',
    'https://indianexpress.com/section/india/feed/'
  ];

  for (const url of feeds) {
    try {
      console.log(`Fetching Indian Express: ${url}`);
      const feed = await parser.parseURL(url);
      console.log(`Title: ${feed.title}`);
      console.log(`Total items: ${feed.items.length}`);
      if (feed.items.length > 0) {
        console.log(`Sample item title: ${feed.items[0].title}`);
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err.message);
    }
  }
}

testIE();
