import { Float, Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart2, Bell,  FileText,
  Globe, Leaf, MessageSquare, Shield, Star, TrendingUp, Users, Zap,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { animate } from "framer-motion/dom";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { t } from "./i18n";

function NetworkSphere() {
  const meshRef = useRef(null);
  const particlesRef = useRef(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      particlesRef.current.rotation.z = state.clock.elapsedTime * 0.04;
    }
  });

  const particlePositions = new Float32Array(600);
  for (let i = 0; i < 200; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2.2 + Math.random() * 0.8;
    particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = r * Math.cos(phi);
  }

  return (
    <group>
      <ambientLight intensity={0.3} color="#00ff88" />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#00ff88" />
      <pointLight position={[-5, -3, -5]} intensity={0.8} color="#d4a04a" />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshStandardMaterial color="#00cc66" wireframe emissive="#00aa44" emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshStandardMaterial color="#001a0d" transparent opacity={0.7} emissive="#003322" emissiveIntensity={0.3} />
      </mesh>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#44ffaa" transparent opacity={0.85} sizeAttenuation />
      </points>
      <Stars radius={40} depth={20} count={600} factor={3} fade speed={1} />
    </group>
  );
}

function Typewriter({ text, className }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) { setDisplayed(text.slice(0, i)); i++; }
      else clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [text]);
  return <span className={`${className ?? ""} typewriter-cursor`}>{displayed}</span>;
}

function StatNumber({ value, suffix, prefix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 2.2, ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = `${prefix ?? ""}${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : Math.floor(v)}${suffix ?? ""}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, prefix]);
  return <span ref={ref}>{prefix ?? ""}0{suffix ?? ""}</span>;
}

const STATS = [
  { value: 146, suffix: "M+", labelKey: "homePageStat1Label", icon: Users },
  { value: 8.5, suffix: "%", labelKey: "homePageStat2Label", icon: TrendingUp },
  { value: 30, suffix: "%", labelKey: "homePageStat3Label", icon: BarChart2 },
  { value: 2.5, suffix: "L Cr", prefix: "₹", labelKey: "homePageStat4Label", icon: Globe },
  { value: 500, suffix: "+", labelKey: "homePageStat5Label", icon: FileText },
  { value: 25, suffix: "", labelKey: "homePageStat6Label", icon: Shield },
];

const productionData = [
  { year: "2019", value: 12.4 }, { year: "2020", value: 14.8 },
  { year: "2021", value: 18.2 }, { year: "2022", value: 22.5 },
  { year: "2023", value: 28.1 }, { year: "2024", value: 34.6 },
];
const incomeData = [
  { name: "Traditional", income: 18500 },
  { name: "Contract Farming", income: 24100 },
  { name: "Organic Contract", income: 31200 },
];
const stateData = [
  { state: "Punjab", farmers: 12400 }, { state: "Maharashtra", farmers: 18700 },
  { state: "Karnataka", farmers: 15200 }, { state: "UP", farmers: 22300 },
  { state: "MP", farmers: 9800 },
];

const FEATURES = [
  { icon: Globe, titleKey: "homePageFeature1", descKey: "homePageFeature1Desc", color: "oklch(0.65 0.22 145)" },
  { icon: Zap, titleKey: "homePageFeature2", descKey: "homePageFeature2Desc", color: "oklch(0.75 0.14 75)" },
  { icon: FileText, titleKey: "homePageFeature3", descKey: "homePageFeature3Desc", color: "oklch(0.65 0.22 145)" },
  { icon: TrendingUp, titleKey: "homePageFeature4", descKey: "homePageFeature4Desc", color: "oklch(0.75 0.14 75)" },
  { icon: Bell, titleKey: "homePageFeature5", descKey: "homePageFeature5Desc", color: "oklch(0.65 0.22 145)" },
  { icon: MessageSquare, titleKey: "homePageFeature6", descKey: "homePageFeature6Desc", color: "oklch(0.75 0.14 75)" },
];

const TESTIMONIALS = [
  { name: "Ramesh Patel", roleKey: "testimonial1Role", locationKey: "testimonial1Location", quoteKey: "testimonial1Quote", avatar: "RP", stars: 5 },
  { name: "Sunita Devi", roleKey: "testimonial2Role", locationKey: "testimonial2Location", quoteKey: "testimonial2Quote", avatar: "SD", stars: 5 },
  { name: "Vikram Aggarwal", roleKey: "testimonial3Role", locationKey: "testimonial3Location", quoteKey: "testimonial3Quote", avatar: "VA", stars: 5 },
  { name: "Lakshmi Narayanan", roleKey: "testimonial4Role", locationKey: "testimonial4Location", quoteKey: "testimonial4Quote", avatar: "LN", stars: 5 },
];


export default function App() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [shuffledFeatures, setShuffledFeatures] = useState(FEATURES);
  const [siteLang, setSiteLang] = useState(() => localStorage.getItem('agri_lang') || 'en');

  // Derive display language name from code
  const getLanguageName = (lang) => lang === 'hi' ? 'Hindi' : lang === 'kn' ? 'Kannada' : 'English';

  useEffect(() => {
    const interval = setInterval(() => setCurrentTestimonial((p) => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onLangChange = (e) => {
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
      setSiteLang(l);
    };
    window.addEventListener('agri:lang:change', onLangChange);
    return () => {
      try { window.removeEventListener('agri:lang:change', onLangChange); } catch (e) {}
    };
  }, []);

  useEffect(() => {
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const interval = setInterval(() => {
    setShuffledFeatures(shuffleArray(FEATURES));
  }, 5000);

  return () => clearInterval(interval);
}, []);

  const handleLanguageChange = (e) => {
    const langName = e.target.value; // 'English', 'Hindi', or 'Kannada'
    const langCode = langName === 'Hindi' ? 'hi' : langName === 'Kannada' ? 'kn' : 'en';
    setSiteLang(langCode);
    localStorage.setItem('agri_lang', langCode);
    window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: langCode } }));
    // Auto-refresh the page to apply language changes immediately
    setTimeout(() => window.location.reload(), 100);
  };

  const getSectionId = (item) => {
    switch (item) {
      case "Home": return "home";
      case "How It Works": return "how-agriai-works";
      case "Features": return "platform-features";
      case "Data Insights": return "contract-farming-growth";
      default: return item.toLowerCase().replace(/ /g, "-");
    }
  };

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden">
      <nav className="nav-blur fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-neon" />
            </div>
            <span className="neon-shimmer">AgriAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-xl font-bold">
            {["Home", "How It Works", "Features", "Data Insights"].map((item) => (
              <a
                key={item}
                href={`#${getSectionId(item)}`}
                className="text-white font-bold hover:text-neon transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_6px_#39ff14]">
                {item === "Home" && t('navHome', siteLang)}
                {item === "How It Works" && t('homePageHowItWorks', siteLang) + ' ' + t('homePageWorks', siteLang)}
                {item === "Features" && t('homePageFeatures', siteLang)}
                {item === "Data Insights" && t('homePageGrowth', siteLang)}
              </a>
            ))}
          </div>
            {localStorage.getItem("agriai_email") ? (
            <Link to={(localStorage.getItem("agriai_role") === 'farmer' ? "/dashboard/buyer" : "/dashboard/farmer")} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">{(localStorage.getItem("agriai_name") || "U").split(" ").map(n => n[0]).join("").toUpperCase()}
            </Link>
            ) : (
              <div className="flex items-center gap-3">
                <select 
                  value={getLanguageName(siteLang)}
                  onChange={handleLanguageChange}
                  className="px-3 py-2 text-sm font-bold text-white bg-dark/60 border border-primary/30 rounded-lg hover:border-primary/50 transition-all cursor-pointer hover:bg-dark/80 backdrop-blur-sm appearance-none"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिन्दी</option>
                  <option value="Kannada">ಕನ್ನಡ</option>
                </select>
                <a href="#Getstarted" className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity glow-neon">
                  {t('homePageGetStarted', siteLang)}
                </a>
              </div>
            )}
          </div>
      </nav>

      <section id="home" className="relative min-h-screen flex items-center pt-16 grid-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: "oklch(0.65 0.22 145)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15" style={{ background: "oklch(0.75 0.14 75)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-neon text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary pulse-glow" />
                {t('homePageBadge', siteLang)}
              </div>
              <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <Typewriter text={t('homePageTitle', siteLang)} className="text-foreground" />
              </h1>
              <p className="textmuted-foreground-muted-forground- text-lg leading-relaxed mb-8 max-w-xl">
                {t('homePageDesc', siteLang)} <span className="text-gold font-semibold">{t('homePageFarmers', siteLang)}</span>.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} className="h-[500px] rounded-2xl overflow-hidden">
              <Suspense fallback={<div className="h-full flex items-center justify-center glass-card rounded-2xl"><div className="text-neon animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" /></div>}>
                <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                  <NetworkSphere />
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
                </Canvas>
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="data-insights" className="py-24 bg-dark border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">{t('homePageOpportunityTitle', siteLang)}'s <span className="text-neon">{t('homePageOpportunity', siteLang)}</span></h2>
            <p className="text-white font-bold max-w-xl mx-auto">{t('homePageRealData', siteLang)}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {STATS.map((stat, i) => (
              <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass-card rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <stat.icon className="w-5 h-5 text-neon" />
                </div>
                <div className="font-display text-3xl font-bold text-neon mb-1">
                  <StatNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <div className="text-white font-bold text-sm">{t(stat.labelKey, siteLang)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-agriai-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">{t('homePageHowItWorks', siteLang)} <span className="text-neon">{t('homePageWorks', siteLang)}</span></h2>
            <p className="text-white font-bold text-sm leading-relaxed">{t('homePageSoilToContract', siteLang)}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", icon: "🌱", titleKey: "homePageStep1", descKey: "homePageStep1Desc", color: "oklch(0.65 0.22 145)" },
              { step: "02", icon: "🤖", titleKey: "homePageStep2", descKey: "homePageStep2Desc", color: "oklch(0.75 0.14 75)" },
              { step: "03", icon: "🤝", titleKey: "homePageStep3", descKey: "homePageStep3Desc", color: "oklch(0.65 0.22 145)" },
            ].map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }} className="glass-card rounded-2xl p-8 text-center relative">
                <div className="text-5xl mb-6">{step.icon}</div>
                <div className="font-display text-6xl font-bold opacity-10 absolute top-4 right-6" style={{ color: step.color }}>{step.step}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">{t(step.titleKey, siteLang)}</h3>
                <p className="text-white font-bold text-sm leading-relaxed">{t(step.descKey, siteLang)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform-features" className="py-24 bg-dark border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
        <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16">
        <h2 className="font-display text-4xl font-bold text-foreground mb-4">
          {t('homePageFeaturesTitle', siteLang)} <span className="text-gold">{t('homePageFeatures', siteLang)}</span>
        </h2>
        <p className="text-white font-bold max-w-xl mx-auto">
          {t('homePageFeaturesDesc', siteLang)}
        </p>
        </motion.div>
        <motion.div
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shuffledFeatures.map((feat) => (
          <motion.div
            key={feat.titleKey}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
            layout: { duration: 0.7, ease: "easeInOut"},
            opacity: { duration: 0.4 }
          }}
          className="glass-card rounded-2xl p-6 group hover:border-primary/40 transition-colors flex flex-col items-center text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
            style={{
              background: `${feat.color}18`,
              borderColor: `${feat.color}30`
            }}>
            <feat.icon
              className="w-5 h-5"
              style={{ color: feat.color }}/>
          </div>
          <div className="flex flex-col items-center justify-center mb-2">
            <h3 className="font-display text-lg font-bold text-foreground">
              {t(feat.titleKey, siteLang)}
            </h3>
            {feat.badge && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-accent/40 text-gold mt-2">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-white font-bold text-sm leading-relaxed">
            {t(feat.descKey, siteLang)}
          </p>
          </motion.div>
          ))}
          </motion.div>
        </div>
      </section>

      <section id="contract-farming-growth" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">{t('homePageGrowthTitle', siteLang)} <span className="text-neon">{t('homePageGrowth', siteLang)}</span></h2>
            <p className="text-white font-bold max-w-xl mx-auto">{t('homePageGrowthData', siteLang)}</p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-1">{t('homePageCropProduction', siteLang)}</h3>
              <p className="text-white font-bold text-xs mb-6">{t('homePageCropProductionUnit', siteLang)}</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={productionData}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.22 145)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="oklch(0.65 0.22 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.04 160)" />
                  <XAxis dataKey="year" stroke="oklch(0.6 0.02 160)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="oklch(0.6 0.02 160)" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.03 160)", border: "1px solid oklch(0.65 0.22 145 / 0.3)", borderRadius: "8px" }} labelStyle={{ color: "oklch(0.97 0.01 100)" }} itemStyle={{ color: "oklch(0.65 0.22 145)" }} />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.65 0.22 145)" strokeWidth={2} fill="url(#colorProd)" isAnimationActive animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-1">{t('homePageIncomeComparison', siteLang)}</h3>
              <p className="text-white font-bold text-xs mb-6">{t('homePageIncomeUnit', siteLang)}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.04 160)" />
                  <XAxis dataKey="name" stroke="oklch(0.6 0.02 160)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="oklch(0.6 0.02 160)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.03 160)", border: "1px solid oklch(0.75 0.14 75 / 0.3)", borderRadius: "8px" }} labelStyle={{ color: "oklch(0.97 0.01 100)" }} itemStyle={{ color: "oklch(0.75 0.14 75)" }} formatter={(v) => [`₹${v.toLocaleString()}`, "Income"]} />
                  <Bar dataKey="income" fill="oklch(0.75 0.14 75)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-1">{t('homePageStateDistribution', siteLang)}</h3>
              <p className="text-white font-bold text-xs mb-6">{t('homePageStateUnit', siteLang)}</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.04 160)" />
                  <XAxis dataKey="state" stroke="oklch(0.6 0.02 160)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="oklch(0.6 0.02 160)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "oklch(0.16 0.03 160)", border: "1px solid oklch(0.65 0.22 145 / 0.3)", borderRadius: "8px" }} labelStyle={{ color: "oklch(0.97 0.01 100)" }} itemStyle={{ color: "oklch(0.65 0.22 145)" }} />
                  <Line type="monotone" dataKey="farmers" stroke="oklch(0.65 0.22 145)" strokeWidth={2.5} dot={{ fill: "oklch(0.65 0.22 145)", r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} isAnimationActive animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-card-dark border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">{t('homePageTestimonials', siteLang)}</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            <motion.div key={currentTestimonial} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="glass-card rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-4">
                {[1,2,3,4,5].slice(0, TESTIMONIALS[currentTestimonial].stars).map((n) => (
                  <Star key={n} className="w-5 h-5 fill-current text-gold" />
                ))}
              </div>
              <p className="text-foreground text-lg leading-relaxed mb-8 italic">"{t(TESTIMONIALS[currentTestimonial].quoteKey, siteLang)}"</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-neon text-sm">{TESTIMONIALS[currentTestimonial].avatar}</div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">{TESTIMONIALS[currentTestimonial].name}</div>
                  <div className="text-white font-bold text-sm">{t(TESTIMONIALS[currentTestimonial].roleKey, siteLang)} · {t(TESTIMONIALS[currentTestimonial].locationKey, siteLang)}</div>
                </div>
              </div>
            </motion.div>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((t, i) => (
                <button type="button" key={t.name} onClick={() => setCurrentTestimonial(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentTestimonial ? "bg-primary w-6" : "bg-muted-foreground/40"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {!localStorage.getItem("agriai_email") && (
      <section id="Getstarted" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20" style={{ background: "oklch(0.65 0.22 145)" }} />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-display text-5xl font-bold text-foreground mb-6">{t('homePageCTATitle', siteLang)} <span className="text-neon">{""}</span></h2>
            <p className="text-white font-bold text-xl mb-10 max-w-2xl mx-auto">{t('homePageCTADescription', siteLang)}</p>
            <div className="flex justify-center">
              <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all glow-neon text-lg">
                {t('homePageJoinUs', siteLang)} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      )}

      <footer className="bg-dark border-t border-border py-4">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid md:grid-cols-4 gap-8 mb-6">
      
      <div>
        <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-neon" />
          </div>
          <span className="text-neon">AgriAI</span>
        </div>
        <p className="text-white text-sm leading-relaxed">
          {t('footerDescription', siteLang)}
        </p>
      </div>

      {[
        { title: t('footerPlatform', siteLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
        { title: t('footerUsers', siteLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
        { title: t('footerLegal', siteLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', siteLang), path: "/contact" }] },
      ].map((col) => (
        <div key={col.title}>
          <h4 className="font-semibold text-foreground mb-4">{col.title}</h4>
          <ul className="space-y-2">
            {col.links.map((link) => {
              const label = typeof link === 'string' ? t(link, siteLang) : link.label;
              const path = typeof link === 'string' ? "/" : link.path;
              return (
                <li key={label}>
                  {path === "/contact" ? (
                    <Link to="/contact" className="text-white text-sm hover:text-neon transition-colors">
                      {label}
                    </Link>
                  ) : (
                    <a href={path} className="text-white text-sm hover:text-neon transition-colors">
                      {label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>

    <div className="border-t border-border pt-6 flex justify-center items-center text-white text-sm">
      <span>
        © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
      </span>
    </div>
  </div>
</footer>
    </div>
  );
}