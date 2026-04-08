import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Chatbot.css';

const initialMessages = [];
const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:5000';
const AGMARKNET_API_KEY = '579b464db66ec23bdd0000017904e9540634499d702edcacef299acc';
const AGMARKNET_API_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const AGMARKNET_COMMODITIES = [
  'potato', 'tomato', 'onion', 'wheat', 'rice', 'maize', 'barley', 'sugarcane', 'cotton', 'coffee', 'tea',
  'banana', 'apple', 'orange', 'grapes', 'mango', 'coconut', 'ginger', 'tur', 'arhar', 'lentil', 'pulses',
  'mustard', 'chilli', 'peas', 'beans', 'cauliflower', 'cabbage', 'brinjal', 'garlic', 'coriander', 'soybean'
];
const AGMARKNET_STATES = [
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat', 'haryana', 'himachal pradesh',
  'jharkhand', 'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland',
  'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura', 'uttar pradesh', 'uttarakhand',
  'west bengal', 'andaman and nicobar islands', 'chandigarh', 'dadra and nagar haveli', 'daman and diu', 'delhi',
  'jammu and kashmir', 'ladakh', 'puducherry'
];
const PRICE_QUERY_PATTERN = /(?:price|rate|market|mandi|agmarknet|modal|arrival|commodity|crop|wholesale|daily price|price of)/i;

const normalizeTitleCase = (text) => text
  .replace(/(^|\s)[a-z]/g, (match) => match.toUpperCase())
  .replace(/\s+/g, ' ')
  .trim();

const translateText = (lang, key, fallback) => {
  if (translations[lang] && translations[lang][key]) return translations[lang][key];
  if (translations.en && translations.en[key]) return translations.en[key];
  return fallback;
};

const extractAgmarknetFilters = (text) => {
  const lc = text.toLowerCase();
  const filters = {};

  for (const commodity of AGMARKNET_COMMODITIES) {
    const pattern = new RegExp(`\\b${commodity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) {
      filters.commodity = commodity;
      break;
    }
  }

  for (const state of AGMARKNET_STATES) {
    const pattern = new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) {
      filters.state = normalizeTitleCase(state);
      break;
    }
  }

  // Try to extract APMC or market names (e.g., "Davangere APMC", "Bangalore market")
  const apmcMatch = lc.match(/([a-z]+)\s+apmc/i);
  if (apmcMatch) {
    filters.market = normalizeTitleCase(apmcMatch[1]) + ' APMC';
  } else {
    const districtMatch = lc.match(/district(?: of| is| in)?\s+([a-z ]+)/i);
    if (districtMatch) {
      filters.district = normalizeTitleCase(districtMatch[1].replace(/district/i, '').trim());
    }

    const marketMatch = lc.match(/market(?: in| at| of| for)?\s+([a-z ]+)/i);
    if (marketMatch) {
      filters.market = normalizeTitleCase(marketMatch[1].replace(/market/i, '').trim());
    }
  }

  const yesterdayMatch = /yesterd?ay|day before|previous day/i.test(lc);
  const todayMatch = /\btoday\b/i.test(lc);
  if (yesterdayMatch && todayMatch) {
    filters.dateCompare = 'yesterday_vs_today';
  } else if (yesterdayMatch) {
    filters.date = 'yesterday';
  } else if (todayMatch) {
    filters.date = 'today';
  }

  const varietyMatch = lc.match(/variety(?: is| of)?\s+([a-z ]+)/i);
  if (varietyMatch) {
    filters.variety = normalizeTitleCase(varietyMatch[1].trim());
  }

  const gradeMatch = lc.match(/grade(?: is| of)?\s+([a-z0-9 ]+)/i);
  if (gradeMatch) {
    filters.grade = normalizeTitleCase(gradeMatch[1].trim());
  }

  return filters;
};

const formatAgmarknetRecord = (record, lang = 'en') => {
  const commodity = record.Commodity || record.commodity || record['Commodity'] || 'Unknown commodity';
  const market = record.Market || record.market || record['Market'] || 'Unknown market';
  const state = record.State || record.state || record['State'] || '';
  const variety = record.Variety || record.variety || record['Variety'] || 'General';
  const minPrice = record['Min Price'] || record.min_price || record.MinPrice || record.minPrice || 'N/A';
  const maxPrice = record['Max Price'] || record.max_price || record.MaxPrice || record.maxPrice || 'N/A';
  const modalPrice = record['Modal Price'] || record.modal_price || record.ModalPrice || record.modalPrice || 'N/A';

  const modalLabel = translateText(lang, 'modalLabel', 'modal');
  const minLabel = translateText(lang, 'minLabel', 'min');
  const maxLabel = translateText(lang, 'maxLabel', 'max');
  const inLabel = translateText(lang, 'inLabel', 'in');
  const onLabel = translateText(lang, 'onLabel', 'on');

  // Extract and format date
  let date = record.Date || record.date || record['Date'] || record.Arrival || record.arrival || record['Arrival'] || record.UpdatedDate || record.updated_date || '';
  if (date) {
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        date = dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch (e) {}
  }
  date = date || translateText(lang, 'todayLabel', 'Today');

  return `${commodity} (${variety}) ${inLabel} ${market}${state ? `, ${state}` : ''} ${onLabel} ${date}: ${modalLabel} ₹${modalPrice}, ${minLabel} ₹${minPrice}, ${maxLabel} ₹${maxPrice}`;
};

const normalizeAgmarknetDate = (value) => {
  if (!value && value !== 0) return null;
  const date = new Date(String(value).trim());
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const fetchAgmarknetPriceData = async (text, language = 'en') => {
  const filters = extractAgmarknetFilters(text);
  const params = new URLSearchParams({
    'api-key': AGMARKNET_API_KEY,
    format: 'json',
    offset: '0',
    limit: '200'
  });

  if (filters.commodity) params.set('filters[commodity]', filters.commodity);
  const useServerStateFilter = !!filters.district || !!filters.market;
  if (useServerStateFilter && filters.state) params.set('filters[state]', filters.state);
  if (filters.district) params.set('filters[district]', filters.district);
  if (filters.market) params.set('filters[market]', filters.market);

  const url = `${AGMARKNET_API_URL}?${params.toString()}`;
  const res = await fetch(url);
  const data = await res.json();

  const records = Array.isArray(data.records)
    ? data.records
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];

  if (!res.ok) {
    const message = (data && (data.error || data.message || data.status)) ? `${data.error || data.message || data.status}` : 'Agmarknet API request failed';
    throw new Error(message);
  }

  if (!records.length) {
    const translationsForLang = translations[language] || translations.en;
    const filtersText = Object.values(filters).filter(Boolean).join(', ');
    return {
      text: `${translateText(language, 'noCurrentMarketPrices', 'No current market prices found')}${filtersText ? ` ${translateText(language, 'forLabel', 'for')} ${filtersText}` : ''}. ${translateText(language, 'priceQuerySuggestion', 'Try adding a commodity, state, or market to your question.')}`
    };
  }

  // Filter records to match the user's query filters
  let filteredRecords = records;
  
  if (filters.state) {
    filteredRecords = records.filter(r => {
      const recordState = (r.State || r.state || r['State'] || '').toLowerCase();
      return recordState.includes(filters.state.toLowerCase());
    });
  }
  
  if (filters.market && filteredRecords.length > 0) {
    const normalizedMarketQuery = filters.market.toLowerCase().replace(/\s*apmc\s*$/, '').trim();
    filteredRecords = filteredRecords.filter(r => {
      const recordMarketRaw = (r.Market || r.market || r['Market'] || '').toLowerCase().trim();
      const recordMarketClean = recordMarketRaw.replace(/\s*apmc\s*$/, '').trim();
      const recordDistrict = (r.District || r.district || r['District'] || '').toLowerCase().trim();
      return recordMarketRaw.includes(normalizedMarketQuery)
        || recordMarketClean.includes(normalizedMarketQuery)
        || recordDistrict.includes(normalizedMarketQuery);
    });
  }

  const normalizeRecordDate = (record) => normalizeAgmarknetDate(
    record.Date || record.date || record['Date'] || record.Arrival || record.arrival || record['Arrival'] || record.UpdatedDate || record.updated_date
  );
  const todayKey = new Date().toISOString().split('T')[0];
  const yesterdayKey = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (filters.date === 'today') {
    filteredRecords = filteredRecords.filter(r => normalizeRecordDate(r) === todayKey);
  } else if (filters.date === 'yesterday') {
    filteredRecords = filteredRecords.filter(r => normalizeRecordDate(r) === yesterdayKey);
  }

  const recordsToDisplay = filteredRecords.length > 0 ? filteredRecords : (filters.market ? [] : records);

  if (filters.dateCompare === 'yesterday_vs_today') {
    const todayRecords = filteredRecords.filter(r => normalizeRecordDate(r) === todayKey);
    const yesterdayRecords = filteredRecords.filter(r => normalizeRecordDate(r) === yesterdayKey);
    const translationsForLang = translations[language] || translations.en;
    const todaySummary = todayRecords.length
      ? todayRecords.slice(0, 5).map((record, idx) => `${idx + 1}. ${formatAgmarknetRecord(record, language)}`).join('\n')
      : `${translateText(language, 'noRecordsForToday', 'No records for today.')}`;
    const yesterdaySummary = yesterdayRecords.length
      ? yesterdayRecords.slice(0, 5).map((record, idx) => `${idx + 1}. ${formatAgmarknetRecord(record, language)}`).join('\n')
      : `${translateText(language, 'noRecordsForYesterday', 'No records for yesterday.')}`;
    const details = filters.commodity ? filters.commodity : translationsForLang.currentCropPrices || 'current crop prices';
    return {
      text: `${translationsForLang.marketPricesFor || 'Market prices for'} ${details}${filters.state ? ` ${translationsForLang.inLabel || 'in'} ${filters.state}` : ''}${filters.market ? ` ${translationsForLang.atLabel || 'at'} ${filters.market}` : ''}:\n\n${translateText(language, 'todayLabel', 'Today')}:\n${todaySummary}\n\n${translateText(language, 'yesterdayLabel', 'Yesterday')}:\n${yesterdaySummary}`
    };
  }

  if (filters.market && recordsToDisplay.length === 0) {
    return {
      text: `${translateText(language, 'noCurrentMarketPrices', 'No current market prices found')} ${translateText(language, 'forLabel', 'for')} ${filters.market} ${translateText(language, 'inLabel', 'in')} ${filters.state || translateText(language, 'requestedRegionLabel', 'the requested region')}.`
    };
  }

  // Show 10 results if no market specified, 5 if market specified
  const resultLimit = filters.market ? 5 : 10;
  const summary = recordsToDisplay.slice(0, resultLimit).map((record, idx) => `${idx + 1}. ${formatAgmarknetRecord(record, language)}`).join('\n');
  const translationsForLang = translations[language] || translations.en;
  const details = filters.commodity ? filters.commodity : translationsForLang.currentCropPrices || 'current crop prices';
  return {
    text: `${translationsForLang.marketPricesFor || 'Market prices for'} ${details}${filters.state ? ` ${translationsForLang.inLabel || 'in'} ${filters.state}` : ''}${filters.market ? ` ${translationsForLang.atLabel || 'at'} ${filters.market}` : ''}:\n${summary}`
  };
};

function getTimeGreeting() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 5) return 'Good morning';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
const translations = {
  en: {
    greeting: (time) => `${time} and Namaste — Welcome to AgriAI. I am your farming assistant. How can I help you today?`,
    demo: 'Sorry, I am a demo! (You can connect me to a real AI backend.)',
    placeholder: 'Type your message...',
    botName: 'Farmer',
    botSubtitle: 'Your Farming Assistant',
    marketPricesFor: 'Market prices for',
    currentCropPrices: 'current crop prices',
    onLabel: 'on',
    inLabel: 'in',
    atLabel: 'at',
    modalLabel: 'modal',
    minLabel: 'min',
    maxLabel: 'max',
    todayLabel: 'Today',
    yesterdayLabel: 'Yesterday',
    noCurrentMarketPrices: 'No current market prices found',
    priceQuerySuggestion: 'Try adding a commodity, state, or market to your question.',
    noRecordsForToday: 'No records for today.',
    noRecordsForYesterday: 'No records for yesterday.',
    forLabel: 'for',
    requestedRegionLabel: 'the requested region'
  },
    hi: {
      greeting: () => 'नमस्ते — AgriAI में आपका स्वागत है। मैं आपका कृषि सहायक। मैं आपकी कैसे मदद कर सकता हूँ?',
      demo: 'माफ़ कीजिये, मैं एक डेमो हूँ! (आप मुझे किसी वास्तविक AI backend से कनेक्ट कर सकते हैं.)',
      placeholder: 'अपना संदेश टाइप करें...',
        botName: 'किसान',
      botSubtitle: 'आपका कृषि सहायक',
      marketPricesFor: 'बाज़ार की कीमतें',
      currentCropPrices: 'वर्तमान फ़सल की कीमतें',
      onLabel: 'पर',
      inLabel: 'में',
      atLabel: 'पर',
      modalLabel: 'मोडल',
      minLabel: 'न्यूनतम',
      maxLabel: 'अधिकतम',
      todayLabel: 'आज',
      yesterdayLabel: 'कल',
      noCurrentMarketPrices: 'कोई वर्तमान मंडी की कीमतें नहीं मिलीं',
      priceQuerySuggestion: 'कृपया अपने प्रश्न में कोई फ़सल, राज्य, या मंडी जोड़ें।',
      noRecordsForToday: 'आज के लिए कोई रिकार्ड नहीं मिला।',
      noRecordsForYesterday: 'कल के लिए कोई रिकार्ड नहीं मिला।',
      forLabel: 'के लिए',
      requestedRegionLabel: 'अनुरोधित क्षेत्र'
    },
    kn: {
      greeting: () => 'ನಮಸ್ಕಾರ — AgriAIಗೆ ಸ್ವಾಗತ. ನಾನು ಕಿಸಾನ್, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕರಾಗಿದ್ದೇನೆ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
      demo: 'ಕ್ಷಮಿಸಿ, ನಾನು ಒಂದು ಡೆಮೋ! (ನೀವು ನನ್ನನ್ನು ನಿಜವಾದ AI ಬ್ಯಾಕ್‌ಎಂಡ್‌ಗೆ ಸಂಪರ್ಕಿಸಬಹುದಾಗಿದೆ.)',
      placeholder: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
        botName: 'ರೈತ',
      botSubtitle: 'ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ',
      marketPricesFor: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು',
      currentCropPrices: 'ಪ್ರಸ್ತುತ ಬೆಳೆ ಬೆಲೆಗಳು',
      onLabel: 'ನಲ್ಲಿ',
      inLabel: 'ನಲ್ಲಿ',
      atLabel: 'ನಲ್ಲಿ',
      modalLabel: 'ಮಾಡಲ್',
      minLabel: 'ಕನಿಷ್ಠ',
      maxLabel: 'ಗರಿಷ್ಠ',
      todayLabel: 'ಇಂದು',
      yesterdayLabel: 'ನಿನ್ನೆ',
      noCurrentMarketPrices: 'ಪ್ರಸ್ತುತ ಮಾರುಕಟ್ಟೆ ಬೆಲಿಗಳು ದೊರೆಯಲಿಲ್ಲ',
      priceQuerySuggestion: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯಲ್ಲಿ ಬೆಳೆ, ರಾಜ್ಯ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಸೇರಿಸಿ.',
      noRecordsForToday: 'ಇಂದು ಯಾವುದೇ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.',
      noRecordsForYesterday: 'ನಿನ್ನೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.',
      forLabel: 'ಕೆಲಗಾಗಿ',
      requestedRegionLabel: 'ಕೋರಿಕೆಯ ಪ್ರಾದೇಶಿಕ'
    }
  };

// language mapping removed (not required)

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const greetingShownRef = useRef(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('agri_lang') || 'en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-chatbot', onOpen);
    return () => window.removeEventListener('open-chatbot', onOpen);
  }, []);

  useEffect(() => {
    if (open && !greetingShownRef.current && messages.length === 0) {
      const timeGreeting = getTimeGreeting();
      const t = translations[language] || translations.en;
      const greetingText = typeof t.greeting === 'function' ? t.greeting(timeGreeting) : t.greeting;
      setMessages([{ sender: 'bot', text: greetingText }]);
      greetingShownRef.current = true;
    }
  }, [open, language, messages.length]);

  // Keep chatbot language in sync with navbar/site language changes
  useEffect(() => {
    const onLangChange = (e) => {
      try {
        const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
        setLanguage(l);
      } catch (err) {}
    };
    window.addEventListener('agri:lang:change', onLangChange);
    return () => window.removeEventListener('agri:lang:change', onLangChange);
  }, []);

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

  // language auto-detection removed; we use selected `language` preference instead

  // ✅ Modified Speak Function – removes unwanted symbols
  const speakText = (text, idx, langPref) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('TTS not supported in this browser.');
      return;
    }

    const synth = window.speechSynthesis;
    if (speakingIndex === idx) {
      synth.cancel();
      setSpeakingIndex(null);
      return;
    }
    try { synth.cancel(); } catch (e) {}

    // Speak the output text verbatim (exactly as returned by the AI),
    // only normalize repeated whitespace so TTS doesn't stutter.
    let toSpeak = text === null || text === undefined ? '' : String(text);
    toSpeak = toSpeak.replace(/\s+/g, ' ').trim();
    if (!toSpeak) return;

    // Prefer explicit language preference, fall back to selected language
    const pref = (langPref || language || 'en').toLowerCase();
    const mapped = pref === 'hi' ? 'hi-IN' : (pref === 'kn' ? 'kn-IN' : 'en-IN');

    // For Hindi and Kannada TTS, strip symbols so they are not read aloud
    // Keep letters in the target script, digits, whitespace and basic sentence punctuation
    if (pref === 'hi') {
      try {
        toSpeak = toSpeak.replace(/[⚠️💬🌾🤖🪴]/g, '');
        toSpeak = toSpeak.replace(/[^0-9\u0900-\u097F\s.,!?]/g, '');
        toSpeak = toSpeak.replace(/\s+/g, ' ').trim();
        if (!toSpeak) return;
      } catch (e) {}
    }
    // For Kannada: strip symbols and convert digits to Kannada words for accurate TTS
    if (pref === 'kn') {
      try {
        toSpeak = toSpeak.replace(/[⚠️💬🌾🤖🪴]/g, '');
        // keep Kannada letters, digits and basic punctuation
        toSpeak = toSpeak.replace(/[^0-9\u0C80-\u0CFF\s.,!?]/g, '');

        // Convert digit sequences to Kannada words (digit-by-digit)
        const digitMap = {
          '0': 'ಶೂನ್ಯ', '1': 'ಒಂದು', '2': 'ಎರಡು', '3': 'ಮೂರು', '4': 'ನಾಲ್ಕು',
          '5': 'ಐದು', '6': 'ಆರು', '7': 'ಏಳು', '8': 'ಎಂಟು', '9': 'ಒಂಬತ್ತು'
        };
        toSpeak = toSpeak.replace(/\d+/g, function (m) {
          return m.split('').map(d => digitMap[d] || d).join(' ');
        });

        toSpeak = toSpeak.replace(/\s+/g, ' ').trim();
        if (!toSpeak) return;
      } catch (e) {}
    }

    const utter = new SpeechSynthesisUtterance(toSpeak);
    utter.lang = mapped;
    utter.rate = 1;
    utter.pitch = 1.1;

    const voices = synth.getVoices();
    try { console.debug('TTS voices available:', voices.map(v => ({name: v.name, lang: v.lang}))); } catch (e) {}

    const pickVoiceForLang = (voicesList, target) => {
      const tgt = (target || '').toLowerCase();
      // prefer voices that exactly match or start with the language code
      let v = voicesList.find(voice => {
        const lv = (voice.lang || '').toLowerCase();
        return lv === tgt || lv.startsWith(tgt.split('-')[0]);
      });
      if (v) return v;
      // prefer a female-like voice in the target family
      v = voicesList.find(voice => {
        const lv = (voice.lang || '').toLowerCase();
        if (!(lv === tgt || lv.startsWith(tgt.split('-')[0]))) return false;
        const nameLower = (voice.name || '').toLowerCase();
        return nameLower.includes('female') || nameLower.includes('woman') || nameLower.includes('zira') || nameLower.includes('kiran') || nameLower.includes('priya') || nameLower.includes('ravi') || voice.gender === 'female';
      });
      return v || null;
    };

    const selectBestVoice = () => {
      // Try exact target, then fallbacks: for Kannada prefer Kannada -> Hindi -> English
      let v = pickVoiceForLang(voices, mapped);
      if (!v && mapped.startsWith('kn')) v = pickVoiceForLang(voices, 'hi-IN') || pickVoiceForLang(voices, 'en-IN');
      if (!v && mapped.startsWith('hi')) v = pickVoiceForLang(voices, 'en-IN');
      if (!v) v = voices[0] || null;
      return v;
    };

    let chosen = null;
    if (voices.length === 0) {
      // voices may not be loaded yet; wait for onvoiceschanged
      synth.onvoiceschanged = () => {
        try {
          const loaded = synth.getVoices();
          const v = selectBestVoice(loaded);
          if (v) utter.voice = v;
          try { synth.speak(utter); } catch (e) { console.warn('TTS speak failed after voiceschanged', e); }
        } catch (e) { console.warn('voiceschanged handler error', e); }
      };
      // do nothing further; emitter will speak when voices load
      return;
    } else {
      chosen = selectBestVoice();
    }

    if (chosen) utter.voice = chosen;
    utter.onend = () => setSpeakingIndex(null);
    utter.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);

    if (voices.length === 0) {
      synth.onvoiceschanged = () => synth.speak(utter);
    } else {
      synth.speak(utter);
    }
  };

  const startStopListening = () => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    if (listening) {
      try { window._chat_recognition && window._chat_recognition.stop(); } catch (e) {}
      setListening(false);
      return;
    }
    const rec = new SpeechRec();
    window._chat_recognition = rec;
    const inputLang = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : 'kn-IN';
    rec.lang = inputLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const txt = ev.results[0][0].transcript || '';
      setInput(txt);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const clearConversation = () => {
    if (window.confirm('Clear all messages? This action cannot be undone.')) {
      setMessages([]);
      greetingShownRef.current = false;
      if (open) {
        const timeGreeting = getTimeGreeting();
        const t = translations[language] || translations.en;
        const greetingText = typeof t.greeting === 'function' ? t.greeting(timeGreeting) : t.greeting;
        setMessages([{ sender: 'bot', text: greetingText }]);
        greetingShownRef.current = true;
      }
    }
  };

  // ✅ Modified AI call — short replies unless "detail" is requested
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setLoading(true);

    console.log("📤 Sending payload:", JSON.stringify({ q: userInput, lang: language }));

    try {
      const isPriceQuery = PRICE_QUERY_PATTERN.test(userInput);
      if (isPriceQuery) {
        try {
          const agResult = await fetchAgmarknetPriceData(userInput, language);
          setMessages(prev => [...prev, { sender: 'bot', text: agResult.text }]);
          setLoading(false);
          return;
        } catch (apiError) {
          console.warn('Agmarknet API fetch failed:', apiError);
          setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ Agmarknet lookup failed: ${apiError.message}. Falling back to regular assistant response.` }]);
        }
      }

      const wantsDetailEn = /\b(detail|explain|expand|more|detailed|step|step-by-step)\b/i.test(userInput);
      const wantsStepEn = /\b(step|stepwise|steps|how to|how do i)\b/i.test(userInput);
      const wantsDetailHi = /(?:विस्तार|विस्तृत|बताइए|समझाइए|विस्तार से)/i.test(userInput);
      const wantsStepHi = /(?:कदम|स्टेप|कैसे|कदम-दर-कदम|कदम दर कदम)/i.test(userInput);
      const wantsDetailKn = /(?:ವಿವರ|ವಿಸ್ತಾರ|ವಿಸ್ತೃತ|ವಿವರವಾಗಿ)/i.test(userInput);
      const wantsStepKn = /(?:ಹಂತ|ಹಂತಗಳ|ಹೆಚ್ಚಿನ ವಿವರ|ಸ್ಟೆಪ್|ಹಂತಗಳಾಗಿ)/i.test(userInput);

      const langFlag = language || 'en';
      const wantsDetail = (langFlag === 'hi' && (wantsDetailHi || wantsStepHi)) || (langFlag === 'kn' && (wantsDetailKn || wantsStepKn)) || (langFlag === 'en' && (wantsDetailEn || wantsStepEn));
      const wantsStepwise = (langFlag === 'hi' && wantsStepHi) || (langFlag === 'kn' && wantsStepKn) || (langFlag === 'en' && wantsStepEn);

      // Build user prompt; keep short if not requested
      let userPrompt = userInput;
      if (!wantsDetail && !wantsStepwise) {
        userPrompt = `${userInput}. Give a short and clear answer (max 3 sentences).`;
      }

      const mode = wantsStepwise ? 'stepwise' : (wantsDetail ? 'detailed' : 'short');

      console.log(`📤 Sending to ${base}/ai/groq:`, { q: userPrompt, lang: langFlag, mode });

      const res = await fetch(`${base}/ai/groq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: userPrompt, lang: langFlag, mode })
      });

      console.log("📨 Response status:", res.status);
      const data = await res.json();
      console.log("📨 Response data:", data);

      if (res.ok && data.result) {
        const resultText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        setMessages(prev => [...prev, { sender: 'bot', text: resultText }]);
      } else {
        const errMsg = (data && (data.error || data.detail)) ? `${data.error || ''} ${data.detail || ''}`.trim() : 'Backend error, please try again.';
        setMessages(prev => [...prev, { sender: 'bot', text: `⚠️ ${errMsg}` }]);
      }
    } catch (err) {
      console.error("❌ AI request failed:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        apiBase: base
      });
      const errorMsg = err.message || "Connection failed";
      setMessages(prev => [...prev, { sender: "bot", text: `⚠️ Connection failed: ${errorMsg}. Make sure the backend is running at ${base}` }]);
    } finally {
      setLoading(false);
    }
  };

  const t = translations[language] || translations.en;
  const chatbotName = t.botName || 'Kisaan';
  const chatbotSubtitle = t.botSubtitle || 'Your Farming Assistant';

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
            <div className="chatbot-header">
              <div className="chatbot-header-content">
                <div className="chatbot-avatar-wrapper">
                  <div className="chatbot-avatar">👩‍🌾</div>
                  <div className="chatbot-status-dot"></div>
                </div>
                <div className="chatbot-header-text">
                  <div className="chatbot-name">{chatbotName}</div>
                  <div className="chatbot-subtitle">{chatbotSubtitle}</div>
                </div>
              </div>

              

              <div className="chatbot-header-actions">
                <button className="chatbot-clear-btn" onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6H21M8 6V4C8 3.5 8.5 3 9 3H15C15.5 3 16 3.5 16 4V6M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6H19Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>

                <button className="chatbot-close-btn" onClick={() => setOpen(false)} aria-label="Close chatbot" title="Close chatbot">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="chatbot-messages-wrapper">
              <div className="chatbot-messages">
                {messages.length === 0 && (
                  <div className="chatbot-empty-state">
                    <div className="chatbot-empty-icon">💬</div>
                    <p>Start a conversation with Kisaan</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chatbot-msg-wrapper chatbot-msg-wrapper-${msg.sender}`}>
                    <motion.div
                      className={`chatbot-msg chatbot-msg-${msg.sender}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>{msg.text}</span>
                    </motion.div>
                    {msg.sender === 'bot' && (
                        <button
                        className="speaker-inline-btn"
                        onClick={() => speakText(msg.text, idx, language)}
                        title={speakingIndex === idx ? 'Stop' : 'Listen'}
                      >
                        {speakingIndex === idx ? (
                          <svg viewBox="0 0 24 24" width="16" height="16"><rect x="5" y="5" width="14" height="14" fill="#39FF14" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 10v4h4l5 5V5L7 10H3z" fill="#39FF14" /></svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="chatbot-loading">
                    <div className="chatbot-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="chatbot-input-row">
              <button
                className={`chatbot-mic-btn ${listening ? 'listening' : ''}`}
                onClick={startStopListening}
                aria-label="Start voice input"
                title={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="9" y="3" width="6" height="10" rx="3" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z" /></svg>
                )}
              </button>

              <input
                type="text"
                className="chatbot-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={translations[language]?.placeholder || translations.en.placeholder}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={loading}
              />

              <button
                className={`chatbot-send-btn ${loading ? 'disabled' : ''}`}
                onClick={handleSend}
                aria-label="Send"
                disabled={loading || !input.trim()}
                title="Send message"
              >
                {loading ? (
                  <svg className="chatbot-spinner" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416"><animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite" /></circle></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" /></svg>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
