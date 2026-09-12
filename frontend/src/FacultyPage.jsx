import React, { useEffect, useState } from 'react';

const FacultyPage = ({ API }) => {
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/public/faculty`);
      const data = await res.json();
      if (data.success) {
        setFaculty(data.data);
      } else {
        setError('Failed to load faculty information');
      }
    } catch (err) {
      setError('Error fetching faculty data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  const getFacultyList = () => {
    if (!faculty) return [];
    if (filterCategory === 'All') {
      return [...(faculty.Principal || []), ...(faculty.Teachers || []), ...(faculty.Support || [])];
    } else if (filterCategory === 'Principal') {
      return faculty.Principal || [];
    } else if (filterCategory === 'Teachers') {
      return faculty.Teachers || [];
    } else {
      return faculty.Support || [];
    }
  };

  const currentFaculty = getFacultyList();

  return (
    <div className="public-page faculty-page">
      <div className="page-header">
        <h1>Faculty & Staff</h1>
        <p>Meet Our Dedicated Educators and Support Team</p>
      </div>

      <div className="page-container">
        <section className="faculty-intro">
          <p>
            Our faculty comprises highly qualified and experienced educators dedicated to fostering academic excellence 
            and holistic development. Each member brings expertise, passion, and commitment to student success.
          </p>
        </section>

        <section className="faculty-filter">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterCategory === 'All' ? 'active' : ''}`}
              onClick={() => setFilterCategory('All')}
            >
              All ({(faculty?.Principal?.length || 0) + (faculty?.Teachers?.length || 0) + (faculty?.Support?.length || 0)})
            </button>
            <button 
              className={`filter-btn ${filterCategory === 'Principal' ? 'active' : ''}`}
              onClick={() => setFilterCategory('Principal')}
            >
              Principal ({faculty?.Principal?.length || 0})
            </button>
            <button 
              className={`filter-btn ${filterCategory === 'Teachers' ? 'active' : ''}`}
              onClick={() => setFilterCategory('Teachers')}
            >
              Teachers ({faculty?.Teachers?.length || 0})
            </button>
            <button 
              className={`filter-btn ${filterCategory === 'Support' ? 'active' : ''}`}
              onClick={() => setFilterCategory('Support')}
            >
              Support Staff ({faculty?.Support?.length || 0})
            </button>
          </div>
        </section>

        {currentFaculty.length > 0 ? (
          <section className="faculty-section">
            <div className="faculty-grid">
              {currentFaculty.map((member, index) => (
                <div key={index} className="faculty-card">
                  <div className="faculty-photo">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} />
                    ) : (
                      <div className="placeholder-photo">👨‍🏫</div>
                    )}
                  </div>
                  <div className="faculty-details">
                    <h3>{member.name}</h3>
                    <p className="faculty-category">{member.category}</p>
                    
                    {member.qualification && (
                      <p className="qualification">
                        <strong>Qualification:</strong> {member.qualification}
                      </p>
                    )}
                    
                    {member.subject && (
                      <p className="subject">
                        <strong>Subject:</strong> {member.subject}
                      </p>
                    )}
                    
                    {member.email && (
                      <p className="contact">
                        <strong>Email:</strong> {member.email}
                      </p>
                    )}
                    
                    {member.phone && (
                      <p className="contact">
                        <strong>Phone:</strong> {member.phone}
                      </p>
                    )}

                    {member.assignedClasses && member.assignedClasses.length > 0 && (
                      <div className="assigned-classes">
                        <strong>Classes:</strong>
                        <div className="class-tags">
                          {member.assignedClasses.map((cls, idx) => (
                            <span key={idx} className="class-tag">{cls}</span>
                          ))}
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
            <p>Faculty information for this category is not available yet.</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default FacultyPage;
