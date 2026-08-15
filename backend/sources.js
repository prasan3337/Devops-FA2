export const SOURCES = [
  // === 1. Top Stories / Important / Breaking News ===
  {
    id: "ndtv-top",
    name: "NDTV",
    url: "http://feeds.feedburner.com/ndtvnews-top-stories",
    category: "top-stories",
    region: "India",
    isTopStorySource: true
  },
  {
    id: "toi-top",
    name: "Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    category: "top-stories",
    region: "India",
    isTopStorySource: true
  },
  {
    id: "indian-express-top",
    name: "Indian Express",
    url: "https://indianexpress.com/feed/",
    category: "top-stories",
    region: "India",
    isTopStorySource: true
  },
  {
    id: "bbc-top",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/rss.xml",
    category: "top-stories",
    region: "Global",
    isTopStorySource: true
  },
  {
    id: "cnn-top",
    name: "CNN News",
    url: "https://news.google.com/rss/search?q=when:24h+source:CNN&hl=en-US&gl=US&ceid=US:en",
    category: "top-stories",
    region: "Global",
    isTopStorySource: true
  },
  {
    id: "nyt-top",
    name: "NY Times",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    category: "top-stories",
    region: "Global",
    isTopStorySource: true
  },

  // === 2. International / World News ===
  {
    id: "ndtv-world",
    name: "NDTV",
    url: "http://feeds.feedburner.com/ndtvnews-world-news",
    category: "international",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "toi-world",
    name: "Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    category: "international",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "indian-express-world",
    name: "Indian Express",
    url: "https://indianexpress.com/section/world/feed/",
    category: "international",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "bbc-world",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/world/rss.xml",
    category: "international",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "cnn-world",
    name: "CNN News",
    url: "https://news.google.com/rss/search?q=when:24h+source:CNN+world&hl=en-US&gl=US&ceid=US:en",
    category: "international",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "nyt-world",
    name: "NY Times",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    category: "international",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "guardian-world",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    category: "international",
    region: "Global",
    isTopStorySource: false
  },

  // === 3. Politics & National News ===
  {
    id: "indian-express-politics",
    name: "Indian Express",
    url: "https://indianexpress.com/section/india/feed/",
    category: "politics",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "bbc-politics",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/politics/rss.xml",
    category: "politics",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "cnn-politics",
    name: "CNN News",
    url: "https://news.google.com/rss/search?q=when:24h+source:CNN+politics&hl=en-US&gl=US&ceid=US:en",
    category: "politics",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "politico-politics",
    name: "Politico",
    url: "https://rss.politico.com/politics-news.xml",
    category: "politics",
    region: "Global",
    isTopStorySource: false
  },

  // === 4. Business & Finance ===
  {
    id: "economic-times",
    name: "Economic Times",
    url: "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
    category: "business",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "ndtv-business",
    name: "NDTV",
    url: "http://feeds.feedburner.com/ndtvnews-people-money",
    category: "business",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "indian-express-business",
    name: "Indian Express",
    url: "https://indianexpress.com/section/business/feed/",
    category: "business",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "cnbc-business",
    name: "CNBC",
    url: "https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=business",
    category: "business",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "bbc-business",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/news/business/rss.xml",
    category: "business",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "nyt-business",
    name: "NY Times",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    category: "business",
    region: "Global",
    isTopStorySource: false
  },

  // === 5. Sports ===
  {
    id: "toi-sports",
    name: "Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
    category: "sports",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "ndtv-sports",
    name: "NDTV",
    url: "http://feeds.feedburner.com/ndtvsports-latest",
    category: "sports",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "indian-express-sports",
    name: "Indian Express",
    url: "https://indianexpress.com/section/sports/feed/",
    category: "sports",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "cbs-sports",
    name: "CBS Sports",
    url: "https://www.cbssports.com/rss/headlines/",
    category: "sports",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "bbc-sports",
    name: "BBC News",
    url: "http://feeds.bbci.co.uk/sport/rss.xml",
    category: "sports",
    region: "Global",
    isTopStorySource: false
  },

  // === 6. Entertainment ===
  {
    id: "ndtv-movies",
    name: "NDTV",
    url: "http://feeds.feedburner.com/ndtvmovies-latest",
    category: "entertainment",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "toi-entertainment",
    name: "Times of India",
    url: "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
    category: "entertainment",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "indian-express-entertainment",
    name: "Indian Express",
    url: "https://indianexpress.com/section/entertainment/feed/",
    category: "entertainment",
    region: "India",
    isTopStorySource: false
  },
  {
    id: "cnn-entertainment",
    name: "CNN News",
    url: "https://news.google.com/rss/search?q=when:24h+source:CNN+entertainment&hl=en-US&gl=US&ceid=US:en",
    category: "entertainment",
    region: "Global",
    isTopStorySource: false
  },
  {
    id: "variety-entertainment",
    name: "Variety",
    url: "https://variety.com/feed/",
    category: "entertainment",
    region: "Global",
    isTopStorySource: false
  }
];
