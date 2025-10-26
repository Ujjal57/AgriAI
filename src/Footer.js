import React from 'react';

const Footer = () => (
  <footer className="agriai-footer">
    <div className="footer-content">
      <h2 className="footer-title">AgriAI</h2>
      <h2 className="footer-title1">AI-Enhanced Contract Farming and Farmer Advisory System</h2>
      <div className="footer-icons">
        <a href="https://github.com/Ujjal57" className="footer-icon" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" style={{width: '2.2rem', height: '2.2rem'}} />
        </a>
        <a href="https://www.linkedin.com/in/ujjal-kumar-dey-1691652a5?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="footer-icon" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" style={{width: '2.2rem', height: '2.2rem'}} />
        </a>
      </div>
      <div className="footer-copy">
        © {new Date().getFullYear()} AgriAI. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
