import React, { useEffect, useState } from 'react';

const AcademicPrograms = ({ API }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/public/programs`);
      const data = await res.json();
      if (data.success) {
        setPrograms(data.data);
      } else {
        setError('Failed to load programs');
      }
    } catch (err) {
      setError('Error fetching programs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page academics-page">
      <div className="page-header">
        <h1>Academic Programs</h1>
        <p>Excellence in Education Across All Levels</p>
      </div>

      <div className="page-container">
        <section className="academics-intro">
          <p>
            Excellence Academy offers comprehensive educational programs from foundational classes through secondary education. 
            Each program is designed to meet international standards while keeping local needs in perspective.
          </p>
        </section>

        {programs.length > 0 ? (
          <section className="programs-section">
            <div className="programs-grid">
              {programs.map((program, index) => (
                <div key={index} className="program-card">
                  <div className="program-header">
                    <h3>{program.className}</h3>
                    <span className="session-badge">{program.session}</span>
                  </div>
                  <div className="program-body">
                    <p className="program-description">{program.description}</p>
                    
                    {program.sectionCount > 0 && (
                      <div className="program-info">
                        <span className="info-item">📚 Sections: {program.sectionCount}</span>
                      </div>
                    )}

                    {program.subjects && program.subjects.length > 0 && (
                      <div className="subjects-section">
                        <h4>Key Subjects</h4>
                        <div className="subjects-list">
                          {program.subjects.slice(0, 5).map((subject, idx) => (
                            <span key={idx} className="subject-tag">{subject}</span>
                          ))}
                          {program.subjects.length > 5 && (
                            <span className="subject-tag more">+{program.subjects.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="empty-state">
            <p>Programs information will be available soon.</p>
          </div>
        )}

        <section className="curriculum-section">
          <h2>Our Curriculum Approach</h2>
          <div className="curriculum-grid">
            <div className="curriculum-card">
              <h4>🎯 Competency-Based</h4>
              <p>Focus on developing essential skills like critical thinking, communication, and problem-solving.</p>
            </div>
            <div className="curriculum-card">
              <h4>🌍 Global Perspective</h4>
              <p>Incorporating international standards while maintaining cultural relevance and local context.</p>
            </div>
            <div className="curriculum-card">
              <h4>🔬 STEM Integration</h4>
              <p>Strong emphasis on Science, Technology, Engineering, and Mathematics across all levels.</p>
            </div>
            <div className="curriculum-card">
              <h4>🎨 Holistic Learning</h4>
              <p>Balance between academics, arts, sports, and co-curricular activities.</p>
            </div>
          </div>
        </section>

        <section className="facilities-section">
          <h2>Learning Facilities</h2>
          <div className="facilities-grid">
            <div className="facility">📚 Modern Libraries</div>
            <div className="facility">💻 Computer Labs</div>
            <div className="facility">🔬 Science Labs</div>
            <div className="facility">🎨 Art Studios</div>
            <div className="facility">🏃‍♂️ Sports Facilities</div>
            <div className="facility">📖 Digital Learning Platform</div>
            <div className="facility">🎭 Auditorium</div>
            <div className="facility">🍱 Cafeteria</div>
          </div>
        </section>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AcademicPrograms;
