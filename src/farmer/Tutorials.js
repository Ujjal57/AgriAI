import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Leaf, Search, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import Navbar from '../Navbar';
import logo from '../assets/logo192.png';
import { t } from '../i18n';

const Tutorials = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  const [expandedIndex, setExpandedIndex] = React.useState(null);
  const [speakingIndex, setSpeakingIndex] = React.useState(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [category, setCategory] = React.useState('help');
  const [selectedVideo, setSelectedVideo] = React.useState(null);
  const [videoLangFilter, setVideoLangFilter] = React.useState('en');
  const [userRole, setUserRole] = React.useState(() => localStorage.getItem('agriai_role') || 'farmer');
  const speechRef = React.useRef(null);
  
  React.useEffect(() => {
    const onLang = (e) => {
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
      setSiteLang(l);
    };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);
  
  // Update userRole when localStorage changes
  React.useEffect(() => {
    const checkRole = () => {
      const role = localStorage.getItem('agriai_role');
      if (role) setUserRole(role);
    };
    checkRole();
    window.addEventListener('storage', checkRole);
    const interval = setInterval(checkRole, 1000);
    return () => {
      window.removeEventListener('storage', checkRole);
      clearInterval(interval);
    };
  }, []);
  
  // Speech recognition for microphone input
  const recognitionRef = React.useRef(null);
  
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = category === 'tutorials' ? 'kn-IN' : (siteLang === 'hi' ? 'hi-IN' : siteLang === 'kn' ? 'kn-IN' : 'en-US');
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          setSearchQuery(transcript);
          setShowSuggestions(true);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [siteLang, category]);
  
  // Update recognition language when category changes
  React.useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = category === 'tutorials' ? 'kn-IN' : (siteLang === 'hi' ? 'hi-IN' : siteLang === 'kn' ? 'kn-IN' : 'en-US');
    }
  }, [category, siteLang]);
  
  const toggleMicrophone = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  // Tutorial data with translations - useMemo to update when language changes
  // Use different translation keys based on user role (farmer or buyer)
  const tutorials = React.useMemo(() => {
    const isBuyer = userRole === 'buyer';
    const getKey = (num) => (isBuyer ? 'buyerTutorial' : 'tutorial') + num;
    return [
      {
        title: t(getKey(1) + 'Title', siteLang),
        description: t(getKey(1) + 'Desc', siteLang),
        steps: t(getKey(1) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(2) + 'Title', siteLang),
        description: t(getKey(2) + 'Desc', siteLang),
        steps: t(getKey(2) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(3) + 'Title', siteLang),
        description: t(getKey(3) + 'Desc', siteLang),
        steps: t(getKey(3) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(4) + 'Title', siteLang),
        description: t(getKey(4) + 'Desc', siteLang),
        steps: t(getKey(4) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(5) + 'Title', siteLang),
        description: t(getKey(5) + 'Desc', siteLang),
        steps: t(getKey(5) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(6) + 'Title', siteLang),
        description: t(getKey(6) + 'Desc', siteLang),
        steps: t(getKey(6) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(7) + 'Title', siteLang),
        description: t(getKey(7) + 'Desc', siteLang),
        steps: t(getKey(7) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(8) + 'Title', siteLang),
        description: t(getKey(8) + 'Desc', siteLang),
        steps: t(getKey(8) + 'Steps', siteLang) || []
      },
      {
        title: t(getKey(9) + 'Title', siteLang),
        description: t(getKey(9) + 'Desc', siteLang),
        steps: t(getKey(9) + 'Steps', siteLang) || []
      }
    ];
  }, [siteLang, userRole]);

  // Filter tutorials based on search
  const filteredTutorials = tutorials.filter(tutorial => 
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get matching suggestions from titles only
  const suggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    // Common stop words to ignore
    const stopWords = ['what', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'how', 'do', 'can', 'will', 'be', 'have', 'has', 'had'];
    const queryWords = searchQuery.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));
    if (queryWords.length === 0) return [];
    const matchedTitles = tutorials
      .filter(tutorial => {
        const titleLower = tutorial.title.toLowerCase();
        // Check if any meaningful word (3+ chars) from the query matches in the title
        return queryWords.some(word => {
          const titleWords = titleLower.split(/\s+/);
          return titleWords.some(titleWord => 
            titleWord.includes(word) || word.includes(titleWord)
          );
        });
      })
      .map(tutorial => tutorial.title);
    return [...new Set(matchedTitles)];
  }, [searchQuery, tutorials]);

  // Toggle function for expanding/collapsing tutorial entries
  const toggleTutorial = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Text-to-speech function
  const speakText = (text, index) => {
    // Stop any current speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (speakingIndex === index) {
      // Already speaking this one, stop it
      setSpeakingIndex(null);
      return;
    }

    setSpeakingIndex(index);

    // Clean the text for speech (remove bullet points)
    const cleanText = text.replace(/[•]/g, '').replace(/\n/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set language and find appropriate voice based on siteLang
    const langMap = {
      'hi': 'hi-IN',
      'en': 'en-US'
    };
    utterance.lang = langMap[siteLang] || 'en-US';
    
    // Try to find a voice for the selected language
    const voices = window.speechSynthesis.getVoices();
    const langVoice = siteLang === 'hi' ? voices.find(v => v.lang.startsWith('hi')) : 
                      voices.find(v => v.lang.startsWith('en'));
    if (langVoice) {
      utterance.voice = langVoice;
    }

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speak tutorial with title, description, and steps
  const speakTutorial = (tutorial, index) => {
    // Check if already speaking this tutorial
    if (speakingIndex === index) {
      if (isPaused) {
        // Resume from pause
        if (speechRef.current) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        }
      } else {
        // Pause the speech
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          setIsPaused(true);
        }
      }
      return;
    }

    // If different tutorial is speaking or paused, cancel it first
    if (speakingIndex !== null) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }

    // Start new speech
    setSpeakingIndex(index);
    setIsPaused(false);

    // Combine title, description, and steps
    const fullText = `${tutorial.title}. ${tutorial.description}. ${tutorial.steps.join('. ')}`;
    
    // Clean the text for speech (remove bullet points)
    const cleanText = fullText.replace(/[•]/g, '').replace(/\n/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set language and find appropriate voice based on siteLang
    const langMap = {
      'hi': 'hi-IN',
      'en': 'en-US'
    };
    utterance.lang = langMap[siteLang] || 'en-US';
    
    // Try to find a voice for the selected language
    const voices = window.speechSynthesis.getVoices();
    const langVoice = siteLang === 'hi' ? voices.find(v => v.lang.startsWith('hi')) : 
                      voices.find(v => v.lang.startsWith('en'));
    if (langVoice) {
      utterance.voice = langVoice;
    }

    utterance.onend = () => {
      setSpeakingIndex(null);
      setIsPaused(false);
      speechRef.current = null;
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
      setIsPaused(false);
      speechRef.current = null;
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech
  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
  };

  return (
    <div style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#000', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .mc-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .mc-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .mc-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <div className="mc-root">
        <Navbar />
        <main style={{padding: '6rem 1rem 6rem', position: 'relative', zIndex: 1, display:'flex', justifyContent:'center'}}>
          <div style={{display:'block', width:'900px', margin:'0 auto',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px) saturate(1.6)',WebkitBackdropFilter:'blur(20px) saturate(1.6)',border:'1px solid rgba(255,255,255,0.6)',borderRadius:'24px',padding:'2.5rem',boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'}}>
            <h1 style={{backgroundImage:'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',textAlign:'center',marginBottom:40,fontSize:'2rem',fontWeight:800,margin:0}}>{userRole === 'buyer' ? t('buyerHelpTitle', siteLang) : (category === 'help' ? t('tutorialsTitle', siteLang) : t('tutorialsPageTitle', siteLang))}</h1>
            
            {/* Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', gap: '15px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                <Search 
                  size={20} 
                  style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} 
                />
                <input
                  type="text"
                  placeholder={category === 'tutorials' ? t('tutorialsPageSearchPlaceholder', siteLang) : t('tutorialsSearchPlaceholder', siteLang)}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && category === 'tutorials' && searchQuery.trim()) {
                      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' in farming')}`, '_blank');
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  style={{
                    width: '100%',
                    padding: '14px 50px 14px 45px',
                    fontSize: '1rem',
                    border: '2px solid #d4edcc',
                    borderRadius: '30px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4caf50';
                    e.target.style.boxShadow = '0 2px 15px rgba(76, 175, 80, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d4edcc';
                    e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                  }}
                />
                {/* Microphone button for speech-to-text */}
                <button
                  onClick={toggleMicrophone}
                  title={isListening ? "Stop listening" : "Search by voice"}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: isListening ? '#1a5c10 ' : 'transparent',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isListening ? (
                    <MicOff size={20} color="white" />
                  ) : (
                    <Mic size={20} color="#000000" />
                  )}
                </button>
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && category === 'help' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #d4edcc',
                    borderRadius: '15px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '5px'
                  }}>
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                        style={{
                          padding: '12px 15px',
                          cursor: 'pointer',
                          borderBottom: idx < suggestions.length - 1 ? '1px solid #e8f5e9' : 'none',
                          transition: 'background 0.2s',
                          color: '#000000'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#e8f5e9'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Category selector buttons - only show for farmers */}
              {userRole !== 'buyer' && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setCategory('help')}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    border: category === 'help' ? '2px solid #1a5c10' : '2px solid #d4edcc',
                    borderRadius: '25px',
                    background: category === 'help' ? '#1a5c10' : 'white',
                    color: category === 'help' ? 'white' : '#1a5c10',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: category === 'help' ? '0 2px 10px rgba(26, 92, 16, 0.3)' : 'none'
                  }}
                >
                  {t('helpCategory', siteLang)}
                </button>
                <button
                  onClick={() => setCategory('tutorials')}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    border: category === 'tutorials' ? '2px solid #1a5c10' : '2px solid #d4edcc',
                    borderRadius: '25px',
                    background: category === 'tutorials' ? '#1a5c10' : 'white',
                    color: category === 'tutorials' ? 'white' : '#1a5c10',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: category === 'tutorials' ? '0 2px 10px rgba(26, 92, 16, 0.3)' : 'none'
                  }}
                >
                  {t('tutorialsCategory', siteLang)}
                </button>
              </div>
              )}
            </div>

            {category === 'help' && (
            <p style={{ textAlign: 'center', color: '#000000', marginBottom: '30px', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {userRole === 'buyer' ? t('buyerTutorialsSubtitle', siteLang) : t('tutorialsSubtitle', siteLang)}
            </p>
            )}

            {category === 'tutorials' && (
            <div style={{ position: 'relative', marginBottom: '30px', padding: '0 20px', height: '40px' }}>
              <p style={{ color: '#1a5c10', marginBottom: 0, fontSize: '1.7rem', fontWeight: 'bold', textAlign: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                {t('tutorialsVideosHeading', siteLang)}
              </p>
              <select
                value={videoLangFilter}
                onChange={(e) => setVideoLangFilter(e.target.value)}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px 15px',
                  fontSize: '1rem',
                  borderRadius: '25px',
                  border: '2px solid #1a5c10',
                  background: 'white',
                  color: '#000000',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">{t('videoFilterAll', siteLang)}</option>
                <option value="en">{t('videoFilterEn', siteLang)}</option>
                <option value="hi">{t('videoFilterHi', siteLang)}</option>
                <option value="kn">{t('videoFilterKn', siteLang)}</option>
              </select>
            </div>
            )}

            {category === 'tutorials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              {t('youtubeVideos', siteLang).filter(video => 
                videoLangFilter === 'all' ? true : video.lang === videoLangFilter
              ).map((video, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedVideo(video)}
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    border: '1px solid #e8f5e9',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <iframe
                    width="100%"
                    height="120px"
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    style={{ borderRadius: '8Modern Farming Techniquespx', pointerEvents: 'none' }}
                  />
                  <p style={{ color: '#000000', fontSize: '0.9rem', fontWeight: '600', margin: 0, textAlign: 'center' }}>
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}
              onClick={() => setSelectedVideo(null)}
            >
              <div 
                style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '20px',
                  maxWidth: '800px',
                  width: '100%',
                  position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedVideo(null)}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: '#1a5c10',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  ✕
                </button>
                <iframe
                  width="100%"
                  height="400px"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{ borderRadius: '10px' }}
                />
                <p style={{ color: '#000000', fontSize: '1.1rem', fontWeight: '600', marginTop: '15px', textAlign: 'center' }}>
                  {selectedVideo.title}
                </p>
              </div>
            </div>
            )}

            {category === 'help' && (
            <div style={{ display: 'grid', gap: '25px' }}>
              {filteredTutorials
                .map((tutorial, index) => (
                <div 
                  key={index}
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    padding: '25px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    border: '1px solid #e8f5e9',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => toggleTutorial(index)}
                >
                  <h2 style={{ 
                    fontSize: '1.4rem', 
                    color: '#1a5c10', 
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}>
                    <span style={{ 
                      background: '#1a5c10', 
                      color: 'white', 
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ flex: 1 }}>{tutorial.title}</span>
                    {/* Speaker button for text-to-speech */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakTutorial(tutorial, index);
                      }}
                      style={{
                        background: speakingIndex === index ? '#4caf50' : 'transparent',
                        border: '2px solid #1a5c10',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginLeft: '10px',
                        transition: 'all 0.3s ease'
                      }}
                      title={isPaused && speakingIndex === index ? "Resume" : speakingIndex === index ? "Pause" : "Listen to this tutorial"}
                    >
                      {speakingIndex === index ? (
                        isPaused ? (
                          <Volume2 size={18} color="white" />
                        ) : (
                          <Volume2 size={18} color="white" />
                        )
                      ) : (
                        <Volume2 size={18} color="#1a5c10" />
                      )}
                    </button>
                    <span style={{ 
                      fontSize: '1.2rem',
                      color: '#1a5c10',
                      transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      marginLeft: '5px'
                    }}>▼</span>
                  </h2>
                  <p style={{ 
                    color: '#000000', 
                    marginBottom: '15px',
                    lineHeight: '1.6'
                  }}>
                    {tutorial.description}
                  </p>
                  {/* Collapsible steps section */}
                  <div style={{
                    maxHeight: expandedIndex === index ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease',
                    opacity: expandedIndex === index ? 1 : 0
                  }}>
                    <ol style={{ 
                      margin: 0, 
                      paddingLeft: '20px',
                      color: '#000000'
                    }}>
                      {tutorial.steps.map((step, stepIndex) => (
                        <li key={stepIndex} style={{ 
                          marginBottom: '8px',
                          lineHeight: '1.5',
                          color: '#000000'
                        }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
            )}

            {category === 'help' && (
            <div style={{
              marginTop: '40px',
              padding: '20px',
              background: '#e8f5e9',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#1a5c10', fontWeight: '500' }}>
                {t('tutorialsNeedHelp', siteLang)}
              </p>
            </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t" style={{background:'oklch(0.12 0.03 160 / 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xl mb-2">
                  <div className="w-7 h-7 rounded-lg border border-primary/40 flex items-center justify-center" style={{background:'oklch(0.65 0.22 145 / 0.2)', borderColor:'oklch(0.65 0.22 145)'}}>
                    <Leaf className="w-3.5 h-3.5" style={{color:'oklch(0.65 0.22 145)'}} />
                  </div>
                  <span style={{color:'oklch(0.65 0.22 145)', fontFamily:"'Times New Roman', Times, serif"}}>AgriAI</span>
                </div>
                <p className="text-white text-sm leading-relaxed" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                  {t('footerDescription', siteLang)}
                </p>
              </div>

              {[
                { title: t('footerPlatform', siteLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
                { title: t('footerUsers', siteLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
                { title: t('footerLegal', siteLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', siteLang), path: "/contact" }] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                  <ul className="space-y-1">
                    {col.links.map((link) => {
                      const label = typeof link === 'string' ? t(link, siteLang) : link.label;
                      const path = typeof link === 'string' ? "/" : link.path;
                      return (
                        <li key={label}>
                          {path === "/contact" ? (
                            <Link to="/contact" className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                              {label}
                            </Link>
                          ) : (
                            <a href={path} className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
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

            <div className="pt-3 flex justify-center items-center text-white text-sm" style={{borderTop:'1px solid oklch(0.65 0.22 145 / 0.12)', fontFamily:"'Times New Roman', Times, serif"}}>
              <span>
                © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Tutorials;