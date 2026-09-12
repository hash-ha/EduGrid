import React, { useEffect, useState } from 'react';

const ContactUs = ({ API }) => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const res = await fetch(`${API}/public/contact`);
      const data = await res.json();
      if (data.success) setContactInfo(data.data);
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setFormMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      setFormSubmitting(true);
      setFormMessage(null);

      const res = await fetch(`${API}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setFormMessage({ type: 'success', text: data.message || 'Thank you for your message! We will get back to you soon.' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setFormMessage({ type: 'error', text: data.message || 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      setFormMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setFormSubmitting(false);
      setTimeout(() => setFormMessage(null), 5000);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page contact-page">
      <div className="page-header">
        <h1>Contact Us</h1>
        <p>Get in Touch with Excellence Academy</p>
      </div>

      <div className="page-container">
        <div className="contact-content">
          <section className="contact-info-section">
            <h2>Our Contact Information</h2>
            {contactInfo && (
              <div className="contact-cards">
                <div className="contact-card main">
                  <h3>{contactInfo.school.name}</h3>
                  <div className="info-item"><span className="icon">📍</span><div><p className="label">Address</p><p className="value">{contactInfo.school.address}</p></div></div>
                  <div className="info-item"><span className="icon">📞</span><div><p className="label">Phone</p><p className="value"><a href={`tel:${contactInfo.school.phone}`}>{contactInfo.school.phone}</a></p></div></div>
                  <div className="info-item"><span className="icon">✉️</span><div><p className="label">Email</p><p className="value"><a href={`mailto:${contactInfo.school.email}`}>{contactInfo.school.email}</a></p></div></div>
                  <div className="info-item"><span className="icon">🕐</span><div><p className="label">Office Hours</p><p className="value">{contactInfo.school.hours}</p></div></div>
                </div>

                <div className="contact-card secondary">
                  <h3>Admissions Office</h3>
                  <div className="info-item"><span className="icon">📞</span><div><p className="label">Phone</p><p className="value"><a href={`tel:${contactInfo.admissions.phone}`}>{contactInfo.admissions.phone}</a></p></div></div>
                  <div className="info-item"><span className="icon">✉️</span><div><p className="label">Email</p><p className="value"><a href={`mailto:${contactInfo.admissions.email}`}>{contactInfo.admissions.email}</a></p></div></div>
                  <div className="info-item"><span className="icon">🕐</span><div><p className="label">Office Hours</p><p className="value">{contactInfo.admissions.hours}</p></div></div>
                </div>
              </div>
            )}
          </section>

          <section className="map-section">
            <h2>School Location</h2>
            <div className="map-container">
              <iframe title="School Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1234567890!2d-74.0060!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a27e15e351d%3A0x1234567890!2s123%20Main%20St%2C%20City%2C%20State%2012345!5e0!3m2!1sen!2s!4v1234567890" width="100%" height="400" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </section>

          <section className="contact-form-section">
            <h2>Send Us a Message</h2>
            <p>Have questions or need more information? Fill out the form below and we'll get back to you as soon as possible.</p>

            <form className="contact-form" onSubmit={handleFormSubmit}>
              {formMessage && <div className={`form-message ${formMessage.type}`}>{formMessage.text}</div>}

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Your full name" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="your.email@example.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="+1-800-123-4567" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleFormChange} placeholder="How can we help?" />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleFormChange} placeholder="Please share your message or inquiry..." rows="6" required />
              </div>

              <button type="submit" className="btn btn-primary" disabled={formSubmitting}>{formSubmitting ? 'Sending...' : 'Send Message'}</button>
            </form>
          </section>
        </div>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <h3>📧 Email Us</h3>
              <p>Send us an email and we'll respond within 24 hours.</p>
              <a href="mailto:info@excellenceacademy.edu" className="btn btn-secondary">Send Email</a>
            </div>
            <div className="action-card">
              <h3>📞 Call Us</h3>
              <p>Speak directly with our team during office hours.</p>
              <a href="tel:+1-800-123-4567" className="btn btn-secondary">Call Now</a>
            </div>
            <div className="action-card">
              <h3>🏫 Visit Us</h3>
              <p>Visit our campus and experience Excellence Academy in person.</p>
              <a href="#map" className="btn btn-secondary">Get Directions</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactUs;
