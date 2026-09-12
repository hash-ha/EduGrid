import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdmissionsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="public-page admissions-page">
      <div className="page-header">
        <h1>Admissions</h1>
        <p>Begin Your Journey at Excellence Academy</p>
      </div>

      <div className="page-container">
        <section className="admissions-intro">
          <p>
            Excellence Academy welcomes applications from qualified students seeking a world-class education 
            in a supportive and stimulating environment. We are committed to admitting students who demonstrate 
            academic potential, character, and a genuine interest in learning.
          </p>
        </section>

        <section className="admissions-process">
          <h2>Admission Process</h2>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Submit Application</h3>
              <p>Complete and submit the online admission form with all required information.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Document Verification</h3>
              <p>Submit required documents for verification by the admissions team.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Entrance Test</h3>
              <p>Appear for the entrance examination (if applicable for your class).</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Interview</h3>
              <p>Attend a brief interview with school officials and/or parents.</p>
            </div>
            <div className="step">
              <div className="step-number">5</div>
              <h3>Admission Decision</h3>
              <p>Receive admission decision and proceed with enrollment formalities.</p>
            </div>
            <div className="step">
              <div className="step-number">6</div>
              <h3>Enrollment</h3>
              <p>Complete fee payment and other registration procedures to finalize admission.</p>
            </div>
          </div>
        </section>

        <section className="requirements-section">
          <h2>Admission Requirements</h2>
          <div className="requirements-grid">
            <div className="requirement-card">
              <h3>📋 Basic Documents</h3>
              <ul>
                <li>Duly filled application form</li>
                <li>Original birth certificate</li>
                <li>Copy of CNIC/passport</li>
                <li>Recent passport-size photographs</li>
                <li>Previous school records</li>
              </ul>
            </div>
            <div className="requirement-card">
              <h3>✓ Academic Requirements</h3>
              <ul>
                <li>Grade transcripts from previous school</li>
                <li>Character certificate</li>
                <li>Good academic standing</li>
                <li>Performance in entrance test (if applicable)</li>
              </ul>
            </div>
            <div className="requirement-card">
              <h3>🏥 Health & Medical</h3>
              <ul>
                <li>Medical fitness certificate</li>
                <li>Vaccination records</li>
                <li>Health insurance information</li>
              </ul>
            </div>
            <div className="requirement-card">
              <h3>💰 Financial Requirements</h3>
              <ul>
                <li>Payment of admission fee</li>
                <li>Proof of fee payment capability</li>
                <li>Scholarship application (if needed)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="eligibility-section">
          <h2>Eligibility Criteria</h2>
          <div className="criteria-content">
            <h3>Academic Requirements</h3>
            <ul className="criteria-list">
              <li>✓ Students must have passed the previous class with satisfactory grades</li>
              <li>✓ Minimum age requirement for each class must be met</li>
              <li>✓ Regular attendance in previous school (minimum 75%)</li>
              <li>✓ Good conduct and discipline record</li>
            </ul>

            <h3>Age Requirements</h3>
            <div className="age-requirements">
              <div className="age-item">
                <strong>Play Group:</strong> 2.5 - 3.5 years
              </div>
              <div className="age-item">
                <strong>Nursery:</strong> 3 - 4 years
              </div>
              <div className="age-item">
                <strong>KG/Prep:</strong> 4 - 5 years
              </div>
              <div className="age-item">
                <strong>Class 1:</strong> 5 - 6 years
              </div>
              <div className="age-item">
                <strong>Class 2 and above:</strong> Determined by class progression
              </div>
            </div>
          </div>
        </section>

        <section className="fees-section">
          <h2>Fee Structure</h2>
          <p>
            For detailed information about current fee structure, scholarships, and payment plans, 
            please visit our <a href="/public/fees">Fee Information</a> page or contact the Admissions Office.
          </p>
          <div className="fee-contact">
            <p>📞 <strong>Phone:</strong> +1-800-123-4567</p>
            <p>✉️ <strong>Email:</strong> admissions@excellenceacademy.edu</p>
            <p>🕐 <strong>Office Hours:</strong> Monday - Friday: 9:00 AM - 3:00 PM</p>
          </div>
        </section>

        <section className="application-cta">
          <h2>Ready to Apply?</h2>
          <p>
            Join us in shaping a promising future for your child. 
            Complete and submit your application today!
          </p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/public/apply')}
          >
            Apply Online Now
          </button>
        </section>

        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-items">
            <div className="faq-item">
              <h4>When does the admission process start?</h4>
              <p>Admissions typically open in December and continue until classes are filled. Early applications are encouraged.</p>
            </div>
            <div className="faq-item">
              <h4>Is an entrance test mandatory?</h4>
              <p>Entrance tests are required for classes 1 and above. For Nursery and KG, admission is based on age and interview.</p>
            </div>
            <div className="faq-item">
              <h4>Do you offer scholarships?</h4>
              <p>Yes, merit-based and need-based scholarships are available for deserving students. Eligibility criteria apply.</p>
            </div>
            <div className="faq-item">
              <h4>What is the teacher-to-student ratio?</h4>
              <p>We maintain a low teacher-to-student ratio to ensure individual attention. On average, it's 1:20 in primary classes.</p>
            </div>
            <div className="faq-item">
              <h4>What is the transportation policy?</h4>
              <p>School provides transportation facilities with a separate transport fee. Parents can also arrange personal transport.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdmissionsPage;
