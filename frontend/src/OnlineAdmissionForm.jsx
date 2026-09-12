import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OnlineAdmissionForm = ({ API }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    dateOfBirth: '',
    gender: 'Male',
    classApplying: 'Class 1',
    phone: '',
    email: '',
    address: '',
    previousSchool: '',
    bForm: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const classes = [
    'Play Group', 'Nursery', 'Prep/KG',
    ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch(`${API}/public/admission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          title: 'Application Submitted Successfully!',
          text: data.message
        });
        setSubmitted(true);
        
        // Reset form
        setTimeout(() => {
          setFormData({
            studentName: '',
            fatherName: '',
            dateOfBirth: '',
            gender: 'Male',
            classApplying: 'Class 1',
            phone: '',
            email: '',
            address: '',
            previousSchool: '',
            bForm: ''
          });
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          title: 'Submission Failed',
          text: data.message || 'Failed to submit application. Please try again.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        title: 'Error',
        text: 'An error occurred while submitting the application. Please try again.'
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && message?.type === 'success') {
    return (
      <div className="public-page admission-form-page">
        <div className="page-header">
          <h1>Online Admission Application</h1>
        </div>
        
        <div className="page-container">
          <section className="success-section">
            <div className="success-box">
              <div className="success-icon">✓</div>
              <h2>{message.title}</h2>
              <p>{message.text}</p>
              <div className="success-info">
                <p>We have received your application and will review it shortly.</p>
                <p>You will be contacted at the provided email and phone number with further details.</p>
              </div>
              <div className="success-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/public')}
                >
                  Back to Home
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/public/admissions')}
                >
                  Admission Information
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page admission-form-page">
      <div className="page-header">
        <h1>Online Admission Application</h1>
        <p>Apply for Admission to Excellence Academy</p>
      </div>

      <div className="page-container">
        <section className="form-intro">
          <p>
            Please fill out the form below with accurate information. All fields marked with * are required.
            After submission, our admissions team will contact you within 2-3 business days.
          </p>
        </section>

        {message && (
          <div className={`form-alert ${message.type}`}>
            <h3>{message.title}</h3>
            <p>{message.text}</p>
          </div>
        )}

        <section className="admission-form-section">
          <form className="admission-form" onSubmit={handleSubmit}>
            
            {/* Student Information */}
            <fieldset className="form-fieldset">
              <legend>Student Information</legend>
              
              <div className="form-group">
                <label htmlFor="studentName">Student Name *</label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="classApplying">Class Applying For *</label>
                <select
                  id="classApplying"
                  name="classApplying"
                  value={formData.classApplying}
                  onChange={handleChange}
                  required
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="previousSchool">Previous School</label>
                <input
                  type="text"
                  id="previousSchool"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleChange}
                  placeholder="Name of previous school (if any)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bForm">B-Form/CNIC Number</label>
                <input
                  type="text"
                  id="bForm"
                  name="bForm"
                  value={formData.bForm}
                  onChange={handleChange}
                  placeholder="Enter B-Form or CNIC number"
                />
              </div>
            </fieldset>

            {/* Parent/Guardian Information */}
            <fieldset className="form-fieldset">
              <legend>Parent/Guardian Information</legend>
              
              <div className="form-group">
                <label htmlFor="fatherName">Father's Name *</label>
                <input
                  type="text"
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Enter father's name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., 0300-1234567"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Residential Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete residential address"
                  rows="3"
                  required
                />
              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="reset"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setFormData({
                    studentName: '',
                    fatherName: '',
                    dateOfBirth: '',
                    gender: 'Male',
                    classApplying: 'Class 1',
                    phone: '',
                    email: '',
                    address: '',
                    previousSchool: '',
                    bForm: ''
                  });
                }}
              >
                Clear Form
              </button>
            </div>

            <div className="form-disclaimer">
              <p>
                <strong>Note:</strong> By submitting this application, you agree that the information 
                provided is accurate and complete. False information may result in rejection of the application. 
                We value your privacy and will use this information only for admission purposes.
              </p>
            </div>
          </form>
        </section>

        <section className="next-steps">
          <h2>What Happens Next?</h2>
          <div className="steps-list">
            <div className="step">
              <span className="step-number">1</span>
              <div>
                <h4>Application Review</h4>
                <p>Our admissions team will review your application and verify all submitted information.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div>
                <h4>Contact & Document Verification</h4>
                <p>We will contact you to collect required documents and schedule an entrance test or interview.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div>
                <h4>Assessment & Interview</h4>
                <p>Student will appear for entrance test (if applicable) and meet with school officials.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div>
                <h4>Admission Decision</h4>
                <p>You will receive the admission decision along with enrollment and fee payment instructions.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h2>Need Help?</h2>
          <p>
            If you have any questions while filling out the form or need assistance, 
            please contact our Admissions Office:
          </p>
          <div className="help-contacts">
            <p>📞 <strong>Phone:</strong> +1-800-123-4567</p>
            <p>✉️ <strong>Email:</strong> admissions@excellenceacademy.edu</p>
            <p>🕐 <strong>Hours:</strong> Monday - Friday: 9:00 AM - 3:00 PM</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OnlineAdmissionForm;
