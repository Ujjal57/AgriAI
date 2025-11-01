import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Chatbot.css';

const initialMessages = [];
const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:5000';





function getTimeGreeting() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 5) return 'Good early morning';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

const translations = {
  en: {
    greeting: (time) => `${time} and Namaste — Welcome to AgriAI. I am Kisaan, your farming assistant. How can I help you today?`,
    demo: 'Sorry, I am a demo! (You can connect me to a real AI backend.)',
    placeholder: 'Type your message...'
  },
  hi: {
    greeting: () => 'नमस्ते — AgriAI में आपका स्वागत है। मैं किसान हूँ, आपका कृषि सहायक। मैं आपकी कैसे मदद कर सकता हूँ?',
    demo: 'माफ़ कीजिये, मैं एक डेमो हूँ! (आप मुझे किसी वास्तविक AI backend से कनेक्ट कर सकते हैं.)',
    placeholder: 'अपना संदेश टाइप करें...'
  },
  ml: {
    greeting: () => 'നമസ്കാരം — AgriAI ലേക്ക് സ്വാഗതം. ഞാൻ കിസാന്‍, നിങ്ങളുടെ കൃഷി സഹായി. ഞാൻ എങ്ങനെ സഹായിക്കാം?',
    demo: 'ക്ഷമിക്കണം, ഞാൻ ഒരു ഡെമോ ആണ്! (നിങ്ങൾ എന്നെ ഒരു thật AI ബാക്ക്‌എൻഡുമായി ബന്ധിപ്പിക്കാൻ കഴിയും.)',
    placeholder: 'നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക...'
  },
  ta: {
    greeting: () => 'வணக்கம் — AgriAI-இற்கு வரவேற்பு. நான் கிஸான், உங்கள் விவசாய உதவியாளர். நான் எப்படி உதவ வேண்டும?',
    demo: 'மன்னிக்கவும், நான் ஒரு டெமோ! (நீங்கள் என்னை ஒரு உண்மையான AI backend-க்கு இணைக்கலாம்.)',
    placeholder: 'உங்கள் செய்தியை টাইப் செய்யவும்...'
  },
  te: {
    greeting: () => 'నమస్కారం — AgriAI కు స్వాగతం. నేను కిసాన్, మీ వ్యవసాయ సహాయకుడు. నేను ఎలా సహాయం చేయగలను?',
    demo: 'క్షమించండి, నేను ఒక డెమో! (మీరు నాకు ఒక నిజమైన AI బ్యాక్‌ఎండ్‌ను కనెక్ట్ చేయవచ్చు.)',
    placeholder: 'మీ సందేశం టైప్ చేయండి...'
  },
  kn: {
    greeting: () => 'ನಮಸ್ಕಾರ — AgriAIಗೆ ಸ್ವಾಗತ. ನಾನು ಕಿಸಾನ್, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕರಾಗಿದ್ದೇನೆ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    demo: 'ಕ್ಷಮಿಸಿ, ನಾನು ಒಂದು ಡೆಮೋ! (ನೀವು ನನ್ನನ್ನು ನಿಜವಾದ AI ಬ್ಯಾಕ್‌ಎಂಡ್‌ಗೆ ಸಂಪರ್ಕಿಸಬಹುದಾಗಿದೆ.)',
    placeholder: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...'
  },
  or: {
    greeting: () => 'ନମସ୍କାର — AgriAI କୁ ସ୍ବାଗତ। ମୁଁ କିସାନ୍, ଆପଣଙ୍କର କୃଷି ସହାୟକ। ମୁଁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
    demo: 'ମାଫ କରନ୍ତୁ, ମୁଁ ଏକ ଡେମୋ! (আপনি আমাকে একটি বাস্তব AI backend-এ সংযুক্ত করতে পারেন.)',
    placeholder: 'ଆପଣଙ୍କର ସନ୍ଦେଶ ଟାଇପ୍ କରନ୍ତୁ...'
  },
  bn: {
    greeting: () => 'নমস্কার — AgriAI-এ স্বাগতম। আমি কিষান, আপনার কৃষি সহায়ক। আমি কিভাবে সাহায্য করতে পারি?',
    demo: 'দুঃখিত, আমি একটি ডেমো! (আপনি আমাকে একটি বাস্তব AI ব্যাকএন্ডের সাথে সংযুক্ত করতে পারেন.)',
    placeholder: 'আপনার বার্তা টাইপ করুন...'
  },
  mr: {
    greeting: () => 'नमस्कार — AgriAI मध्ये आपले स्वागत आहे. मी किसान, तुमचा कृषी सहाय्यक. मी कशी मदत करू?',
    demo: 'क्षमस्व, मी एक डेमो आहे! (आपण मला वास्तविक AI बॅकएंडशी कनेक्ट करू शकता.)',
    placeholder: 'तुमचा संदेश टाइप करा...'
  },
  gu: {
    greeting: () => 'નમસ્તે — AgriAI માં ваше સ્વાગત છે. હું કિસાન છું, તમારો કૃષિ સહાયક. હું કેવી રીતે મદદ કરી શકું?',
    demo: 'માફ કરશો, હું એક ડેમો છું! (તમે મને કોઈ વાસ્તવિક AI બેકએન્ડ સાથે કનેક્ટ કરી શકો છો.)',
    placeholder: 'તમારો સંદેશો લખો...'
  },
  pa: {
    greeting: () => 'ਨਮਸਕਾਰ — AgriAI ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਮੈਂ ਕਿਸਾਨ ਹਾਂ, ਤੁਹਾਡਾ ਖੇਤੀ ਸਹਾਇਕ। ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    demo: 'ਮਾਫ਼ ਕਰੋ, ਮੈਂ ਇੱਕ ਡੈਮੋ ਹਾਂ! (ਤੁਸੀਂ ਮੈਨੂੰ ਕਿਸੇ ਅਸਲ AI ਬੈਕਐਂਡ ਨਾਲ ਜੁੜ ਸਕਦੇ ਹੋ.)',
    placeholder: 'ਆਪਣਾ ਸੁਨੇਹਾ ਟਾਈਪ ਕਰੋ...'
  }
};

const langMap = { en: 'en-IN', hi: 'hi-IN', ml: 'ml-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', or: 'or-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN' };

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const greetingShownRef = useRef(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Listen for a global event to open the chatbot (dispatched from Navbar)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-chatbot', onOpen);
    return () => window.removeEventListener('open-chatbot', onOpen);
  }, []);

  // When chat opens, insert a time-based greeting before user types (only once per open)
  useEffect(() => {
  if (open && !greetingShownRef.current) {
      const timeGreeting = getTimeGreeting();
      const t = translations[language] || translations.en;
      const greetingText = typeof t.greeting === 'function' ? t.greeting(timeGreeting) : t.greeting;
      setMessages(msgs => [ { sender: 'bot', text: greetingText }, ...msgs ]);
      greetingShownRef.current = true;
    }
    if (!open) {
      // reset so next open will re-show greeting
      greetingShownRef.current = false;
    }
  }, [open]);

  // Cancel speaking when chat closes or component unmounts
  useEffect(() => {
    if (!open) {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (e) {}
      setSpeakingIndex(null);
    }
    return () => {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (e) {}
    };
  }, [open]);

  const speakText = (text, idx) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // not supported
      console.warn('TTS not supported in this browser.');
      return;
    }
    const synth = window.speechSynthesis;
    // If already speaking this index, stop
    if (speakingIndex === idx) {
      synth.cancel();
      setSpeakingIndex(null);
      return;
    }
    // Stop any current speech
    try { synth.cancel(); } catch (e) {}
    const utter = new SpeechSynthesisUtterance(text || '');
    // prefer indian english voice if available
    // map selected language to speech lang codes (best-effort)
    utter.lang = langMap[language] || 'en-IN';
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setSpeakingIndex(null);
    utter.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    synth.speak(utter);
  };

  // Speech-to-text (basic) using Web Speech API
  const startStopListening = () => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    if (listening) {
      // Stop
      try { window._chat_recognition && window._chat_recognition.stop(); } catch (e) {}
      setListening(false);
      return;
    }
    const rec = new SpeechRec();
    window._chat_recognition = rec;
  rec.lang = langMap[language] || 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const txt = ev.results[0][0].transcript || '';
      setInput(txt);
    };
    rec.onerror = (e) => {
      console.warn('Speech recognition error', e);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const handleSend = async () => {
  if (!input.trim()) return;

  const userMessage = { sender: "user", text: input };
  setMessages(prev => [...prev, userMessage]);
  setInput("");

  console.log("📤 Sending payload:", JSON.stringify({ q: input, lang: language }));

    try {
    const res = await fetch(`${base}/ai/groq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: input })
    });

    const data = await res.json();

    if (res.ok && data.result) {
      // Ensure result is a string (stringify objects)
      const resultText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      // Add AgriAI tag before the message
      const taggedResponse = `🌾 AgriAI: ${resultText}`;
      // Use sender='bot' so the existing TTS / speaker UI is available for replies
      setMessages(prev => [...prev, { sender: 'bot', text: taggedResponse }]);
    } else {
      // Prefer backend-provided error text if available
      const errMsg = (data && (data.error || data.detail)) ? `${data.error || ''} ${data.detail || ''}`.trim() : 'Backend error, please try again.';
      setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ AgriAI: ${errMsg}` }]);
    }

  } catch (err) {
    console.error("AI request failed", err);
    setMessages(prev => [...prev, { sender: "ai", text: "⚠️ Connection failed" }]);
  }
};



  return (
    <>
      <motion.button
        className="chatbot-launch-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Open chatbot"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.1 }}
      >
        <img src={require('./assets/image 1.png')} alt="Chatbot" className="chatbot-launch-img" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="chatbot-window"
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <div className="chatbot-header">Kisaan</div>
            <div className="chatbot-lang-select">
              <select value={language} onChange={e => setLanguage(e.target.value)} aria-label="Select language">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ml">Malayalam</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="or">Odia</option>
                <option value="bn">Bengali</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="pa">Punjabi</option>
              </select>
            </div>
            <div className="chatbot-messages-wrapper">
              <div className="chatbot-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chatbot-msg chatbot-msg-${msg.sender}`}>
                  <span>{msg.text}</span>
                  {/* speaker button is rendered separately to the right of the messages area */}
                </div>
              ))}
              <div ref={chatEndRef} />
              </div>
              <div className="chatbot-speaker-column">
                {messages.map((msg, idx) => (
                  msg.sender === 'bot' ? (
                    <button key={idx} className="speaker-outside-btn" onClick={() => speakText(msg.text, idx)} title={speakingIndex===idx? 'Stop':'Listen'}>
                      {speakingIndex === idx ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="14" height="14" fill="#236902"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="#236902"/></svg>
                      )}
                    </button>
                  ) : (
                    <div key={'s'+idx} style={{height: '34px'}} />
                  )
                ))}
              </div>
            </div>
            <div className="chatbot-input-row">
              <button className={`chatbot-mic-btn ${listening? 'listening':''}`} onClick={startStopListening} aria-label="Start voice input">
                {listening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="3" width="6" height="10" rx="3"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#236902" xmlns="http://www.w3.org/2000/svg"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg>
                )}
              </button>
              <input
                type="text"
                className="chatbot-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                style={{'::placeholder': { color: '#236902' }}}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button className="chatbot-send-btn" onClick={handleSend} aria-label="Send" style={{background: 'none', padding: '0.3rem 0.7rem'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="#236902"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;