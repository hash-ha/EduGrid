import React, { useEffect, useState } from 'react';

const FeeInformation = ({ API }) => {
  const [feeStructure, setFeeStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeeInfo();
  }, []);

  const fetchFeeInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/public/fee-info`);
      const data = await res.json();
      if (data.success) {
        setFeeStructure(data.data);
      } else {
        setError('Failed to load fee information');
      }
    } catch (err) {
      setError('Error fetching fee information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading">Loading...</div></div>;

  return (
    <div className="public-page fee-page">
      <div className="page-header">
        <h1>Fee Information</h1>
        <p>Transparent and Competitive Fee Structure</p>
      </div>

      <div className="page-container">
        <section className="fee-intro">
          <p>
            Excellence Academy provides quality education at competitive rates. Below is our current fee structure 
            for different classes. For detailed information, flexible payment plans, and scholarship opportunities, 
            please contact our Finance Office.
          </p>
        </section>

        {feeStructure.length > 0 ? (
          <section className="fee-structure-section">
            <div className="fee-table-container">
              <div className="fee-cards-grid">
                {feeStructure.map((structure, index) => (
                  <div key={index} className="fee-card">
                    <h3 className="fee-class">{structure.className}</h3>
                    
                    <div className="fee-items">
                      <h4>Fee Components</h4>
                      {structure.items.length > 0 ? (
                        <table className="fee-table">
                          <tbody>
                            {structure.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="item-type">{item.type}</td>
                                <td className="item-amount">Rs. {item.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No fee items specified</p>
                      )}
                    </div>

                    <div className="fee-total">
                      <strong>Total Annual Fee:</strong>
                      <span className="amount">Rs. {structure.totalAmount.toLocaleString()}</span>
                    </div>

                    {(structure.scholarship > 0 || structure.concession > 0 || structure.siblingDiscount > 0) && (
                      <div className="fee-deductions">
                        <h4>Available Deductions</h4>
                        {structure.scholarship > 0 && (
                          <p>💡 Scholarship: up to Rs. {structure.scholarship.toLocaleString()}</p>
                        )}
                        {structure.concession > 0 && (
                          <p>🎁 Concession: up to Rs. {structure.concession.toLocaleString()}</p>
                        )}
                        {structure.siblingDiscount > 0 && (
                          <p>👥 Sibling Discount: Rs. {structure.siblingDiscount.toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="empty-state">
            <p>Fee structure information is not available at this time. Please contact the office for details.</p>
          </div>
        )}

        <section className="payment-info">
          <h2>Payment Information</h2>
          <div className="payment-cards">
            <div className="payment-card">
              <h3>📅 Payment Schedule</h3>
              <ul>
                <li>Annual Payment (Full)</li>
                <li>Semi-Annual (Half yearly)</li>
                <li>Quarterly (Every 3 months)</li>
                <li>Monthly (Flexible payment plan)</li>
              </ul>
            </div>
            
            <div className="payment-card">
              <h3>💳 Payment Methods</h3>
              <ul>
                <li>Online Bank Transfer</li>
                <li>Credit/Debit Card</li>
                <li>Cash at School Office</li>
                <li>Mobile Wallet Payments</li>
              </ul>
            </div>

            <div className="payment-card">
              <h3>🎓 Scholarships & Assistance</h3>
              <ul>
                <li>Merit-based Scholarships</li>
                <li>Need-based Financial Aid</li>
                <li>Sports Scholarships</li>
                <li>Sibling Discounts</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="additional-fees">
          <h2>Additional Information</h2>
          <div className="info-box">
            <h3>What's Included in School Fees</h3>
            <ul className="included-list">
              <li>✓ Tuition and instruction</li>
              <li>✓ Library and laboratory facilities</li>
              <li>✓ Computer and IT resources</li>
              <li>✓ Sports and physical education</li>
              <li>✓ Co-curricular activities</li>
              <li>✓ Educational materials and stationery</li>
              <li>✓ School events and celebrations</li>
              <li>✓ Basic counseling services</li>
            </ul>
          </div>

          <div className="info-box">
            <h3>Additional Charges (Optional)</h3>
            <ul className="additional-list">
              <li>🚌 Transport Fee (varies by distance)</li>
              <li>🍽️ Meal Plan (if using school cafeteria)</li>
              <li>👕 School Uniform and ID</li>
              <li>📚 Textbooks and Study Materials</li>
              <li>🏅 Sports and Activity Fees</li>
              <li>🎓 Field Trips and Excursions</li>
            </ul>
          </div>
        </section>

        <section className="contact-section">
          <h2>Fee-Related Inquiries</h2>
          <div className="contact-box">
            <p>For detailed fee information, payment plans, and scholarship inquiries, please contact:</p>
            <p><strong>Finance & Accounts Office</strong></p>
            <p>📞 <strong>Phone:</strong> +1-800-123-4567 (Ext. 105)</p>
            <p>✉️ <strong>Email:</strong> fees@excellenceacademy.edu</p>
            <p>🕐 <strong>Office Hours:</strong> Monday - Friday: 9:00 AM - 4:00 PM</p>
          </div>
        </section>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default FeeInformation;
