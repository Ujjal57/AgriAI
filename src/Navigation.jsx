import { Menu, Wheat, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Platform", href: "#features" },
  { label: "Features", href: "#features" },
  { label: "Contracts", href: "#integrity" },
  { label: "Marketplace", href: "#services" },
  { label: "Blog", href: "/" },
  { label: "About", href: "/" },
];

export default function Navigation({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "nav-blur border-b border-white/10 py-3" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <motion.a href="/" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center">
            <Wheat className="w-5 h-5 text-agri-darker" />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-wide">Agri<span className="text-gold">AI</span></span>
        </motion.a>
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.a key={link.label} href={link.href} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }} className="text-sm font-medium text-white/80 hover:text-gold transition-colors duration-200 relative group">
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </nav>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="hidden lg:flex items-center gap-4">
          <a href="/" className="text-sm text-white/70 hover:text-white transition-colors">Login</a>
          <button onClick={onGetStarted} className="rounded-full bg-gold text-agri-darker hover:bg-yellow-300 font-semibold text-sm px-6 py-2 transition-all duration-300 hover:-translate-y-0.5">
            Get Started
          </button>
        </motion.div>
        <button type="button" className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden nav-blur border-t border-white/10">
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-gold transition-colors py-1">{link.label}</a>
              ))}
              <button onClick={() => { setMobileOpen(false); onGetStarted(); }} className="rounded-full bg-gold text-agri-darker font-semibold w-full py-2">
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}