import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ API }) => {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch school info
      const infoRes = await fetch(`${API}/public/school-info`);
      const infoData = await infoRes.json();
      if (infoData.success) setSchoolInfo(infoData.data);

      // Fetch notices
      const noticesRes = await fetch(`${API}/public/notices?limit=3`);
      const noticesData = await noticesRes.json();
      if (noticesData.success) setNotices(noticesData.data);

      // Fetch events
      const eventsRes = await fetch(`${API}/public/events`);
      const eventsData = await eventsRes.json();
      if (eventsData.success) setEvents(eventsData.data.slice(0, 3));
    } catch (err) {
      setError('Failed to load home page data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Luxury learning for bold futures</div>
          <h1>
            <span className="hero-brand">EduGrid</span>
          </h1>
          <p>Premium education for creative minds, confident leaders, and future-ready graduates.</p>
          <div className="hero-meta">
            <span>Admissions Open 2026</span>
            <span>STEM • Arts • Leadership</span>
          </div>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/public/admissions')}>
              Apply Now
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/public/about')}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      {schoolInfo && (
        <section className="quick-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{schoolInfo.studentCount || 0}+</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{schoolInfo.classCount || 0}</div>
              <div className="stat-label">Classes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{schoolInfo.staffCount || 0}+</div>
              <div className="stat-label">Faculty Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{schoolInfo.establishedYear}</div>
              <div className="stat-label">Since {schoolInfo.establishedYear}</div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Notices */}
      {notices.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2>Latest Notices</h2>
            <a href="/public/notices" className="view-all">View All →</a>
          </div>
          <div className="notices-grid">
            {notices.map((notice) => (
              <div key={notice._id} className="notice-card">
                <div className="notice-category">{notice.category}</div>
                <h3>{notice.title}</h3>
                <p>{notice.body.substring(0, 100)}...</p>
                <div className="notice-date">
                  {new Date(notice.publishedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <a href="/public/events" className="view-all">View All →</a>
          </div>
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-image">
                  <div className="placeholder-image">{event.title.charAt(0)}</div>
                </div>
                <div className="event-content">
                  <h3>{event.title}</h3>
                  <p className="event-date">📅 {new Date(event.date).toLocaleDateString()}</p>
                  <p className="event-desc">{event.description}</p>
                  <p className="event-location">📍 {event.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Join Excellence Academy Today</h2>
        <p>Discover the difference quality education can make in your child's future</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/public/admissions')}>
          Start Your Application
        </button>
      </section>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default HomePage;
