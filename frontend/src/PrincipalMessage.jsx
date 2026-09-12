import React, { useEffect, useState } from 'react';

const PrincipalMessage = ({ API }) => {
  const [principal, setPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrincipalMessage();
  }, []);

  const fetchPrincipalMessage = async () => {
    try {
      const res = await fetch(`${API}/public/principal-message`);
      const data = await res.json();
      if (data.success) setPrincipal(data.data);
    } catch (error) {
      console.error('Failed to fetch principal message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page principal-page">
      <div className="page-header">
        <h1>Principal's Message</h1>
        <p>Wisdom and Vision for Educational Excellence</p>
      </div>

      {principal && (
        <div className="page-container">
          <section className="principal-section">
            <div className="principal-content">
              <div className="principal-info">
                <div className="principal-photo">
                  {principal.photo ? (
                    <img src={principal.photo} alt={principal.name} />
                  ) : (
                    <div className="placeholder-photo">👨‍🏫</div>
                  )}
                </div>
                <div className="principal-details">
                  <h2>{principal.name}</h2>
                  {principal.qualification && <p className="qualification">{principal.qualification}</p>}
                  <p className="title">Principal</p>
                </div>
              </div>

              <div className="message-content">
                <h3>A Message from Our Principal</h3>
                <div className="message-text">
                  <p>
                    {principal.message}
                  </p>
                  <p>
                    At Excellence Academy, we believe that education is not merely about imparting knowledge, 
                    but about shaping young minds to become responsible citizens and leaders of tomorrow. 
                    Our faculty and staff are dedicated to creating an environment where every student can 
                    discover their potential and develop the skills needed for success in an ever-changing world.
                  </p>
                  <p>
                    We are committed to fostering critical thinking, creativity, and compassion in our students. 
                    Through a carefully balanced curriculum, we ensure that academics go hand-in-hand with 
                    character development, sports, arts, and community service.
                  </p>
                  <p>
                    I invite you to become part of the Excellence Academy family. Together, let us build 
                    a brighter future for our children and our society.
                  </p>
                  <p className="signature">
                    Warm regards,<br/>
                    <strong>{principal.name}</strong><br/>
                    Principal, Excellence Academy
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="message-section highlights">
            <h3>Our Educational Philosophy</h3>
            <div className="philosophy-cards">
              <div className="philosophy-card">
                <h4>Holistic Development</h4>
                <p>We focus on developing the whole child - intellectually, physically, emotionally, and socially.</p>
              </div>
              <div className="philosophy-card">
                <h4>Quality Teaching</h4>
                <p>Our experienced faculty uses innovative teaching methods to make learning engaging and effective.</p>
              </div>
              <div className="philosophy-card">
                <h4>Safe Environment</h4>
                <p>We maintain a safe, inclusive, and supportive school environment for all our students.</p>
              </div>
              <div className="philosophy-card">
                <h4>Community Partnership</h4>
                <p>We work closely with parents and the community to ensure the best outcomes for our students.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PrincipalMessage;
