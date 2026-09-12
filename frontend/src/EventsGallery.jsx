import React, { useEffect, useState } from 'react';

const EventsGallery = ({ API }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/public/events`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      } else {
        setError('Failed to load events');
      }
    } catch (err) {
      setError('Error fetching events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page events-page">
      <div className="page-header">
        <h1>Events & Activities Gallery</h1>
        <p>Celebrating School Life and Achievements</p>
      </div>

      <div className="page-container">
        <section className="events-intro">
          <p>
            Excellence Academy organizes various events and activities throughout the academic year 
            to enhance student development and celebrate achievements.
          </p>
        </section>

        {events.length > 0 ? (
          <>
            <section className="events-grid-section">
              <div className="events-gallery-grid">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="gallery-item"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="gallery-image">
                      {event.image ? (
                        <img src={event.image} alt={event.title} />
                      ) : (
                        <div className="placeholder-gallery">
                          {event.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="gallery-overlay">
                      <h4>{event.title}</h4>
                      <p>View Details</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {selectedEvent && (
              <section className="event-detail-modal">
                <div className="modal-content">
                  <button className="close-btn" onClick={() => setSelectedEvent(null)}>×</button>
                  
                  <div className="event-detail-image">
                    {selectedEvent.image ? (
                      <img src={selectedEvent.image} alt={selectedEvent.title} />
                    ) : (
                      <div className="placeholder-large">
                        {selectedEvent.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="event-detail-content">
                    <h2>{selectedEvent.title}</h2>
                    
                    <div className="event-details">
                      <div className="detail-item">
                        <span className="label">📅 Date:</span>
                        <span className="value">
                          {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">📍 Location:</span>
                        <span className="value">{selectedEvent.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">📝 Description:</span>
                        <span className="value">{selectedEvent.description}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>Events and activities information coming soon.</p>
          </div>
        )}

        <section className="event-categories">
          <h2>Types of Events</h2>
          <div className="categories-grid">
            <div className="category-card">
              <h3>🏃‍♂️ Sports Events</h3>
              <p>Annual sports days, inter-house competitions, and athletic meets</p>
            </div>
            <div className="category-card">
              <h3>🎨 Cultural Programs</h3>
              <p>Annual day celebrations, cultural fests, and artistic performances</p>
            </div>
            <div className="category-card">
              <h3>🔬 Academic Events</h3>
              <p>Science fairs, competitions, exhibitions, and seminars</p>
            </div>
            <div className="category-card">
              <h3>🎓 Graduation</h3>
              <p>Annual graduation ceremonies and award presentations</p>
            </div>
            <div className="category-card">
              <h3>🤝 Community Service</h3>
              <p>Community outreach programs and social responsibility drives</p>
            </div>
            <div className="category-card">
              <h3>🌍 Educational Trips</h3>
              <p>Field trips, study tours, and experiential learning journeys</p>
            </div>
          </div>
        </section>

        <section className="calendar-section">
          <h2>Academic Calendar Highlights</h2>
          <div className="calendar-info">
            <p>
              For a complete list of school events, holidays, and important dates, 
              please refer to our comprehensive Academic Calendar. 
              The calendar is updated regularly and shared with all stakeholders.
            </p>
            <button className="btn btn-secondary">Download Academic Calendar</button>
          </div>
        </section>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default EventsGallery;
