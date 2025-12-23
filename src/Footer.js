import React from 'react';
import { t } from './i18n';

const Footer = () => {
  const [lang, setLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);

  return (
  <footer className="agriai-footer">
    <div className="footer-content">
      <h2 className="footer-title">{t('siteName', lang)}</h2>
      <h2 className="footer-title1">{t('footerSubtitle', lang)}</h2>
      <div className="footer-icons">
        <a href="https://github.com/Ujjal57" className="footer-icon" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" style={{width: '2.2rem', height: '2.2rem'}} />
        </a>
        <a href="https://www.linkedin.com/in/ujjal-kumar-dey-1691652a5?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="footer-icon" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" style={{width: '2.2rem', height: '2.2rem'}} />
        </a>
      </div>
      <div className="footer-copy">
        {t('footerCopy', lang).replace('{year}', String(new Date().getFullYear()))}
      </div>
    </div>
  </footer>
  );
};

export default Footer;

