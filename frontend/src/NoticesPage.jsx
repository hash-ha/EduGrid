import React, { useEffect, useState } from 'react';

const NoticesPage = ({ API }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/public/notices?limit=100`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.data);
      } else {
        setError('Failed to load notices');
      }
    } catch (err) {
      setError('Error fetching notices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = selectedCategory === 'all'
    ? notices
    : notices.filter(n => n.category === selectedCategory);

  const categories = ['all', 'Notice', 'Homework', 'Event'];

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page notices-page">
      <div className="page-header">
        <h1>Notices & Announcements</h1>
        <p>Stay Updated with School News and Events</p>
      </div>

      <div className="page-container">
        <section className="category-filter">
          <div className="filter-buttons">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {filteredNotices.length > 0 ? (
          <section className="notices-section">
            <div className="notices-list">
              {filteredNotices.map((notice) => (
                <article key={notice._id} className="notice-item">
                  <div className="notice-header">
                    <div className="notice-meta">
                      <span className={`category-badge ${notice.category.toLowerCase()}`}>
                        {notice.category}
                      </span>
                      <span className="notice-date">
                        {new Date(notice.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <h3 className="notice-title">{notice.title}</h3>
                  <p className="notice-body">{notice.body}</p>
                  <div className="notice-footer">
                    <span className="read-time">2 min read</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state">
            <p>No {selectedCategory === 'all' ? 'notices' : selectedCategory.toLowerCase()} available at this time.</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <section className="subscribe-section">
          <h2>Stay Updated</h2>
          <p>Subscribe to receive notifications about important announcements and school events.</p>
          <div className="subscribe-form">
            <input
              type="email"
              placeholder="Enter your email"
              className="subscribe-input"
            />
            <button className="btn btn-primary">Subscribe</button>
          </div>
          <p className="subscribe-note">We respect your privacy. Unsubscribe at any time.</p>
        </section>
      </div>
    </div>
  );
};

export default NoticesPage;
