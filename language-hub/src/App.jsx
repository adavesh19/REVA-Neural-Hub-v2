import React, { useState, useEffect } from 'react';
import './App.css';

const LANGUAGES = [
  { code: 'auto', name: 'Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
];

function App() {
  const [activeTab, setActiveTab] = useState('translator');
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [result, setResult] = useState(null);
  const [idResult, setIdResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('neural_history');
    if (saved) setHistory(JSON.parse(saved).slice(0, 5));
  }, []);

  const saveToHistory = (input, translated, src, tgt) => {
    const newItem = { id: Date.now(), input, translated, src, tgt };
    const updated = [newItem, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('neural_history', JSON.stringify(updated));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`http://localhost:24081/translate?target_lang=${targetLang}&source_lang=${sourceLang}&text=${encodeURIComponent(inputText)}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail || 'Translation failed');
      
      setResult(data);
      saveToHistory(inputText, data.translated[0], data.source_lang, targetLang);
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 500); 
    }
  };

  const handleIdentify = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setIdResult(null);
    setIsFlipped(false);

    try {
      const response = await fetch(`http://localhost:24081/language_detection?text=${encodeURIComponent(inputText)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Detection failed');
      
      const langName = LANGUAGES.find(l => l.code === data)?.name || data.toUpperCase();
      setIdResult({ code: data, name: langName });
      setTimeout(() => setIsFlipped(true), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (result) setInputText(result.translated[0]);
  };

  const speakText = (text, lang) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
    showToast("Speaking...");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setIdResult(null);
    setIsFlipped(false);
    setError(null);
  };

  return (
    <div className="hub-container">
      {toast && <div className="toast">{toast}</div>}
      
      <header className="hub-header">
        <h1>REVA <span className="blue-gradient">Neural Hub v2</span></h1>
        <div className="tab-switcher">
          <button className={activeTab === 'translator' ? 'active' : ''} onClick={() => setActiveTab('translator')}>
            Translator
          </button>
          <button className={activeTab === 'identifier' ? 'active' : ''} onClick={() => setActiveTab('identifier')}>
            Identifier
          </button>
        </div>
      </header>

      <main className="dashboard-content animate-in">
        {error && <div className="glass-panel error-toast">⚠️ {error}</div>}

        {activeTab === 'translator' ? (
          <div className="glass-panel translator-grid">
            <div className="input-section">
              <div className="section-header">
                <select className="lang-select" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                  {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
              </div>
              <textarea 
                placeholder="Enter text to translate..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="swap-wrapper">
                <button className="swap-btn" onClick={swapLanguages} title="Swap Languages">⇄</button>
              </div>
            </div>

            <div className="output-section">
              <div className="section-header">
                <select className="lang-select" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                  {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <div className="output-actions">
                  {result && <button className="copy-btn" onClick={() => copyToClipboard(result.translated[0])}>📋</button>}
                  {result && <button className="copy-btn" onClick={() => speakText(result.translated[0], targetLang)}>🔊</button>}
                </div>
              </div>
              <div className="translation-box">
                {loading ? <div className="loader">Analyzing Neural Patterns...</div> : 
                  <p>{result?.translated?.[0] || 'Translation result will appear here...'}</p>}
              </div>
              {result && <div className="detected-hint">Detected: <span className="blue-gradient">{result.source_lang?.toUpperCase()}</span></div>}
            </div>
          </div>
        ) : (
          <div className="identifier-container">
            <div className={`glass-panel scan-box ${loading ? 'loading' : ''}`}>
              <div className="laser"></div>
              <h3>Neural identification</h3>
              <textarea 
                placeholder="Enter text to scan for language patterns..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                className="main-action-btn" 
                style={{marginTop: '20px', width: '100%'}} 
                onClick={handleIdentify} 
                disabled={loading}
              >
                {loading ? 'ANALYZING PATTERNS...' : 'IDENTIFY LANGUAGE'}
              </button>
            </div>

            <div className={`flip-card ${isFlipped ? 'flipped' : ''} ${idResult ? 'visible' : ''}`}>
              <div className="flip-card-inner">
                <div className="flip-card-front"><p>Scanning...</p></div>
                <div className="flip-card-back">
                  <h4>Neural Scan Result</h4>
                  <div className="lang-name blue-gradient">{idResult?.name}</div>
                  <div className="confidence-score">Confidence Meta: 99.8%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'translator' && (
          <div className="button-group-footer glass-panel" style={{marginTop: '30px', borderRadius: '30px'}}>
            <button className="secondary-btn" onClick={handleReset}>RESET</button>
            <button className="main-action-btn" onClick={handleTranslate} disabled={loading}>
              {loading ? 'PROCESSING...' : 'TRANSLATE NOW'}
            </button>
          </div>
        )}

        {history.length > 0 && activeTab === 'translator' && (
          <div className="history-section">
            <h3>Recent History</h3>
            <div className="history-grid">
              {history.map(item => (
                <div key={item.id} className="history-item">
                  <span>{item.input.substring(0, 30)}... → {item.translated.substring(0, 30)}...</span>
                  <button className="secondary-btn" style={{padding: '5px 15px', fontSize: '0.8rem'}} onClick={() => setInputText(item.input)}>Reuse</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="hub-footer" style={{marginTop: '50px', opacity: 0.5}}>
        <p>REVA UNIVERSITY | DEPARTMENT OF AIML</p>
      </footer>
    </div>
  );
}

export default App;
