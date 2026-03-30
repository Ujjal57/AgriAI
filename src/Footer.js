import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { t } from './i18n';

const Footer = () => {
  const [lang, setLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  const navigate = useNavigate();

  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);

  return (
    <footer className="bg-dark border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-neon" />
              </div>
              <span className="text-neon">AgriAI</span>
            </div>
            <p className="text-white text-sm leading-relaxed">Empowering India's 146 million farmers with transparent, technology-driven agriculture contracts.</p>
          </div>
          {[
            { title: "Platform", links: ["About", "How It Works", "Features", "Pricing"] },
            { title: "Users", links: ["Farmers", "Buyers", "Agribusiness", "Partners"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Service", { label: "Contact Us", href: "/contact" }] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => {
                  const linkLabel = typeof link === 'string' ? link : link.label;
                  const linkHref = typeof link === 'string' ? "/" : link.href;
                  
                  return (
                    <li key={linkLabel}>
                      {linkHref === "/contact" ? (
                        <button 
                          onClick={() => navigate('/contact')} 
                          className="text-white text-sm hover:text-neon transition-colors cursor-pointer bg-none border-none p-0"
                        >
                          {linkLabel}
                        </button>
                      ) : (
                        <a href={linkHref} className="text-white text-sm hover:text-neon transition-colors">{linkLabel}</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

