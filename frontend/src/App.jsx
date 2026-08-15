import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// SVG Icons as inline functional components for lightweight loading and crisp rendering
const IconRefresh = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={{ width: '1.25rem', height: '1.25rem' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem', opacity: 0.6 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1rem', height: '1rem', marginRight: '0.25rem', verticalAlign: 'middle', display: 'inline-block' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const IconExternalLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1rem', height: '1rem', marginLeft: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// Dynamic gradient placeholders for categories if no image exists (no red/orange tones)
const CategoryPlaceholder = ({ category }) => {
  const gradients = {
    'top-stories': 'linear-gradient(135deg, #1e293b, #334155)', // Slate Slate
    'sports': 'linear-gradient(135deg, #0f172a, #1e1b4b)', // Navy Slate Indigo
    'politics': 'linear-gradient(135deg, #1e1b4b, #3b0764)', // Indigo Purple
    'entertainment': 'linear-gradient(135deg, #020617, #0f172a)', // Slate Navy
    'business': 'linear-gradient(135deg, #1e293b, #475569)', // Steel Slate Blue
    'international': 'linear-gradient(135deg, #090d16, #1e293b)' // Ocean Charcoal Steel
  };
  
  const textSymbols = {
    'top-stories': '🔥 Breaking News',
    'sports': '⚽ Sports News',
    'politics': '🏛️ Politics',
    'entertainment': '🎬 Showbiz',
    'business': '💼 Finance',
    'international': '🌍 World News'
  };

  const bg = gradients[category] || 'linear-gradient(135deg, #2c3e50, #3498db)';
  const label = textSymbols[category] || '📰 News';

  return (
    <div className="card-image-placeholder" style={{ background: bg }}>
      <div className="placeholder-text">{label}</div>
    </div>
  );
};

// API base path - defaults to empty string since backend serves build, or fallback to dev server URL
const API_BASE = window.location.port === '5173' ? 'http://localhost:5000' : '';

function App() {
  const [articles, setArticles] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);
  const [category, setCategory] = useState('top-stories');
  const [region, setRegion] = useState('india');
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [importantOnly, setImportantOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    nextSync: null,
    status: 'idle',
    error: null,
    syncCount: 0
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
        if (!data.isSyncing) {
          setSyncingInProgress(false);
        } else {
          setSyncingInProgress(true);
        }
      }
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  }, []);

  // Fetch available sources
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sources`);
      if (res.ok) {
        const data = await res.json();
        // Filter sources based on region if it's set
        let filtered = data;
        if (region !== 'all') {
          filtered = data.filter(s => s.region.toLowerCase() === region.toLowerCase());
        }
        setSourcesList(filtered);
      }
    } catch (err) {
      console.error('Error fetching sources list:', err);
    }
  }, [region]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category,
        region,
        source,
        search: debouncedSearch,
        importantOnly: importantOnly.toString(),
        page: page.toString(),
        limit: '12'
      });

      const res = await fetch(`${API_BASE}/api/news?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [category, region, source, debouncedSearch, importantOnly, page]);

  // Trigger manual sync
  const triggerSync = async () => {
    if (syncingInProgress) return;
    setSyncingInProgress(true);
    try {
      const res = await fetch(`${API_BASE}/api/trigger-sync`, { method: 'POST' });
      if (res.ok) {
        await fetchSyncStatus();
        // Reset to page 1 and fetch latest
        setPage(1);
        await fetchArticles();
      }
    } catch (err) {
      console.error('Error triggering sync:', err);
    } finally {
      setSyncingInProgress(false);
    }
  };

  // Poll sync status every 15 seconds to sync backend updates
  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  // Fetch sources list on mount & when region changes
  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Fetch articles when dependencies change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Reset page when filter configurations change
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const handleRegionChange = (reg) => {
    setRegion(reg);
    setSource('all'); // Reset source filter because sources differ by region
    setPage(1);
  };

  const handleSourceChange = (e) => {
    setSource(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleImportantToggle = (e) => {
    setImportantOnly(e.target.checked);
    setPage(1);
  };

  // Format Dates nicely
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 1) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `${mins}m ago`;
    } else if (diffHrs < 24) {
      return `${Math.round(diffHrs)}h ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Human readable format of last synchronized time
  const formatLastSync = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const categories = [
    { id: 'top-stories', label: 'Top News', icon: '🔥' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'international', label: 'International', icon: '🌍' }
  ];

  return (
    <div className="app-container">
      {/* Background Accent Gradients */}
      <div className="bg-gradient-accent accent-1"></div>
      <div className="bg-gradient-accent accent-2"></div>

      {/* Main Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="logo-icon">📰</span>
          <div className="logo-text">
            <h1>ApexNews</h1>
            <span className="logo-subtext">Real-time Smart Aggregator</span>
          </div>
        </div>

        <div className="header-sync-panel">
          <div className="sync-status-details">
            <span className="sync-badge" data-status={syncStatus.status}>
              ● {syncStatus.isSyncing ? 'Syncing...' : 'Updates Active'}
            </span>
            <span className="sync-timestamp">
              <IconClock /> Last Refreshed: {formatLastSync(syncStatus.lastSync)}
            </span>
          </div>
          <button 
            className={`sync-btn ${syncingInProgress || syncStatus.isSyncing ? 'syncing' : ''}`}
            onClick={triggerSync}
            disabled={syncingInProgress || syncStatus.isSyncing}
            title="Fetch latest updates from news feeds"
          >
            <IconRefresh className={syncingInProgress || syncStatus.isSyncing ? 'spin' : ''} />
            <span>Sync Now</span>
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="app-content">
        
        {/* Navigation & Regions Toolbar */}
        <section className="toolbar-section">
          {/* Region Tabs */}
          <div className="region-selector">
            <button 
              className={`region-pill ${region === 'india' ? 'active' : ''}`}
              onClick={() => handleRegionChange('india')}
            >
              🇮🇳 India
            </button>
            <button 
              className={`region-pill ${region === 'global' ? 'active' : ''}`}
              onClick={() => handleRegionChange('global')}
            >
              🌎 Global
            </button>
          </div>

          {/* Category Navigation Tabs */}
          <nav className="category-navigation">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${category === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-label">{cat.label}</span>
              </button>
            ))}
          </nav>
        </section>

        {/* Search, Filter and Refinements Dashboard */}
        <section className="filters-section">
          <div className="filters-container">
            {/* Search Input */}
            <div className="search-wrapper">
              <IconSearch />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={handleSearchChange}
                className="search-input"
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>×</button>
              )}
            </div>

            {/* Source Filter Dropdown */}
            <div className="filter-select-wrapper">
              <label htmlFor="source-select">Source:</label>
              <select
                id="source-select"
                value={source}
                onChange={handleSourceChange}
                className="filter-select"
              >
                <option value="all">All Publications</option>
                {sourcesList.map(src => (
                  <option key={src.id} value={src.id}>
                    {src.name} {src.region === 'India' ? '(IN)' : '(GL)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Breaking/Important Toggle */}
            <div className="important-toggle-wrapper">
              <label className="checkbox-switch">
                <input
                  type="checkbox"
                  checked={importantOnly}
                  onChange={handleImportantToggle}
                />
                <span className="switch-slider"></span>
              </label>
              <span className="switch-label">Highlight Breaking Only</span>
            </div>
          </div>
          
          <div className="results-meta">
            {loading ? (
              <span>Querying live database...</span>
            ) : (
              <span>Found <strong>{totalCount}</strong> stories in this view</span>
            )}
          </div>
        </section>

        {/* News Cards Grid */}
        <section className="news-grid-section">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Fetching the latest updates...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Articles Found</h3>
              <p>Try resetting your search query or selecting a different source or category.</p>
              {(search || source !== 'all' || importantOnly) && (
                <button 
                  className="reset-btn"
                  onClick={() => {
                    setSearch('');
                    setSource('all');
                    setImportantOnly(false);
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="news-grid">
              {articles.map((article) => (
                <article key={article.guid} className="news-card">
                  {/* Image container */}
                  <div className="card-image-container">
                    {article.image ? (
                      <img 
                        src={article.image} 
                        alt={article.title} 
                        className="card-image"
                        onError={(e) => {
                          // If image fails to load, null it out so fallback placeholder renders
                          e.target.style.display = 'none';
                          const parent = e.target.parentNode;
                          const placeholderDiv = document.createElement('div');
                          placeholderDiv.className = 'card-image-placeholder-fallback';
                          placeholderDiv.style.background = 'linear-gradient(135deg, #1e293b, #334155)';
                          placeholderDiv.innerHTML = '<span style="font-size:1.5rem">📰</span>';
                          parent.appendChild(placeholderDiv);
                        }}
                      />
                    ) : (
                      <CategoryPlaceholder category={article.category} />
                    )}
                    {/* Region indicator badge */}
                    <span className={`region-badge ${article.region.toLowerCase()}`}>
                      {article.region === 'India' ? '🇮🇳 India' : '🌎 Global'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    <div className="card-meta">
                      <span className="card-source" title={`Feed: ${article.source}`}>
                        {article.source}
                      </span>
                      <span className="card-time">
                        <IconClock /> {formatDate(article.pubDate)}
                      </span>
                    </div>

                    <h3 className="card-title" title={article.title}>
                      <a href={article.link} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    </h3>

                    <p className="card-description">
                      {article.description}
                    </p>

                    <div className="card-footer">
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="read-more-link"
                      >
                        Read Full Story <IconExternalLink />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Pagination Section */}
        {!loading && totalPages > 1 && (
          <section className="pagination-section">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page <strong>{page}</strong> of {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 ApexNews. All rights reserved. Automatically updates every 3 hours.</p>
        <div className="footer-links">
          <span>Sources parsed: 30+ Reliable Feeds</span>
          <span className="divider">|</span>
          <span>Deduplication & Local Cache Enabled</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
