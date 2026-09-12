import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PublicLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/public', label: 'Home' },
    { path: '/public/about', label: 'About' },
    { path: '/public/academics', label: 'Academics' },
    { path: '/public/faculty', label: 'Faculty' },
    { path: '/public/admissions', label: 'Admissions' },
    { path: '/public/results', label: 'Results' },
    { path: '/public/contact', label: 'Contact' },
  ];

  const quickLinks = [
    { path: '/public/about', label: 'About School' },
    { path: '/public/principal', label: "Principal's Message" },
    { path: '/public/academics', label: 'Academic Programs' },
    { path: '/public/faculty', label: 'Faculty & Staff' },
    { path: '/public/fees', label: 'Fee Information' },
    { path: '/public/apply', label: 'Online Admission' },
  ];

  const portalLinks = [
    { path: '/public/admissions', label: 'Admissions' },
    { path: '/public/results', label: 'Student Results Portal' },
    { path: '/public/notices', label: 'Notices & Announcements' },
    { path: '/public/events', label: 'Events & Activities Gallery' },
    { path: '/public/contact', label: 'Contact & Location' },
  ];

  return (
    <div className="public-website">
      <header className="public-header">
        <div className="header-topbar">
          <div className="topbar-inner">
            <div className="school-micro">
              <span className="micro-icon">✦</span>
              <span className="micro-text">Admissions Open 2026</span>
            </div>
            <div className="topbar-links">
              <span className="topbar-link"><span className="micro-icon">☎</span>+1-800-123-4567</span>
              <span className="topbar-link"><span className="micro-icon">✉</span>info@excellenceacademy.edu</span>
              <a className="topbar-login" href="/admin">
                <span className="login-icon">↗</span>
                Portal Login
              </a>
            </div>
          </div>
        </div>

        <div className="header-main">
          <div className="header-container">
            <div className="school-logo" onClick={() => navigate('/public')}>
              <div className="logo-mark">
                <span className="logo-icon">EG</span>
              </div>
              <div className="brand-copy">
                <span className="school-name">EduGrid</span>
                <span className="school-tagline">Learning, character & possibility</span>
              </div>
            </div>

            <button className="mobile-menu-btn" aria-label="Toggle navigation menu" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? '✕' : '☰'}
            </button>

            <nav className={`public-nav ${menuOpen ? 'open' : ''}`}> 
              {navItems.map((item) => (
                <a key={item.path} href={item.path} className={`nav-link ${location.pathname === item.path ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate(item.path); setMenuOpen(false); }}>
                  {item.label}
                </a>
              ))}
              <a href="/public/apply" className={`nav-link apply-nav-btn ${location.pathname === '/public/apply' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/public/apply'); setMenuOpen(false); }}>
                <span className="btn-icon">✍️</span>
                <span>Apply Online</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="public-main">
        {children}
      </main>

      <footer className="public-footer">
        <div className="footer-container">
          <div className="footer-section footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-mark">E</span>
            </div>
            <h4>EduGrid</h4>
            <p className="footer-story">A distinguished educational institution dedicated to character development, academic excellence, innovation, and global leadership.</p>
            <p className="footer-note">Established 2010 • Accredited Institution</p>
            <div className="footer-social-links">
              <a href="#" className="social-link">f</a>
              <a href="#" className="social-link">x</a>
              <a href="#" className="social-link">in</a>
              <a href="#" className="social-link">ig</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((item) => (
                <li key={item.path}><a href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path); }}>{item.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h4>Portals & Media</h4>
            <ul>
              {portalLinks.map((item) => (
                <li key={item.path}><a href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path); }}>{item.label}</a></li>
              ))}
              <li><a href="/admin">Staff & Student Login</a></li>
            </ul>
          </div>

          <div className="footer-section footer-contact">
            <h4>Get In Touch</h4>
            <div className="contact-list">
              <div className="contact-row"><span className="contact-icon">☎</span><span>+1-800-123-4567</span></div>
              <div className="contact-row"><span className="contact-icon">✉</span><span>info@excellenceacademy.edu</span></div>
              <div className="contact-row"><span className="contact-icon">⌕</span><span>123 Education Boulevard, Knowledge City, State 12345</span></div>
            </div>
            <a className="footer-cta" href="/public/apply" onClick={(e) => { e.preventDefault(); navigate('/public/apply'); }}>
              <span>Admissions Open 2026</span>
              <span className="cta-arrow">→</span>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} EduGrid. All rights reserved. • Quality Education for Tomorrow's Leaders</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
