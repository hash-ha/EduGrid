import React, { useEffect, useState } from 'react';

const AboutPage = ({ API }) => {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchoolInfo();
  }, []);

  const fetchSchoolInfo = async () => {
    try {
      const res = await fetch(`${API}/public/school-info`);
      const data = await res.json();
      if (data.success) setSchoolInfo(data.data);
    } catch (error) {
      console.error('Failed to fetch school info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page about-page">
      <div className="page-header">
        <h1>About Excellence Academy</h1>
        <p>Building Tomorrow's Leaders Today</p>
      </div>

      {schoolInfo && (
        <div className="page-container">
          <section className="about-section">
            <h2>Our Story</h2>
            <p className="about-text">
              {schoolInfo.about}
            </p>
            <p className="about-text">
              Since {schoolInfo.establishedYear}, Excellence Academy has been committed to providing exceptional education 
              that goes beyond textbooks. We believe in nurturing not just academic excellence, but also character, 
              creativity, and critical thinking skills in our students.
            </p>
          </section>

          <section className="about-section vision-mission">
            <div className="vision-card">
              <h3>👁️ Our Vision</h3>
              <p>{schoolInfo.vision}</p>
            </div>
            <div className="mission-card">
              <h3>🎯 Our Mission</h3>
              <p>{schoolInfo.mission}</p>
            </div>
          </section>

          <section className="about-section values-section">
            <h2>Our Core Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <h4>🌟 Excellence</h4>
                <p>Striving for the highest standards in all we do</p>
              </div>
              <div className="value-card">
                <h4>🤝 Integrity</h4>
                <p>Building trust through honest and ethical conduct</p>
              </div>
              <div className="value-card">
                <h4>📚 Knowledge</h4>
                <p>Fostering a love for learning and continuous growth</p>
              </div>
              <div className="value-card">
                <h4>🌍 Inclusivity</h4>
                <p>Celebrating diversity and welcoming all students</p>
              </div>
              <div className="value-card">
                <h4>💪 Resilience</h4>
                <p>Developing strength to overcome challenges</p>
              </div>
              <div className="value-card">
                <h4>✨ Innovation</h4>
                <p>Embracing new ideas and modern educational approaches</p>
              </div>
            </div>
          </section>

          <section className="about-section highlights">
            <h2>What Makes Us Special</h2>
            <ul className="highlights-list">
              <li>✓ State-of-the-art facilities and modern learning spaces</li>
              <li>✓ Highly qualified and dedicated teaching faculty</li>
              <li>✓ Comprehensive curriculum balancing academics and extracurriculars</li>
              <li>✓ Strong focus on individual student development</li>
              <li>✓ Safe and inclusive learning environment</li>
              <li>✓ Regular engagement with parents and community</li>
              <li>✓ Emphasis on character development and ethics</li>
              <li>✓ Technology-enhanced learning opportunities</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

export default AboutPage;
