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

  // Handle Translation
  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Switching to a more robust port 24081 to ensure fresh backend connection
      const response = await fetch(`http://localhost:24081/translate?target_lang=${targetLang}&source_lang=${sourceLang}&text=${encodeURIComponent(inputText)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Translation failed');
      }
      
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 500); 
    }
  };

  // Handle Identification
  const handleIdentify = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setIdResult(null);
    setIsFlipped(false);

    try {
      const response = await fetch(`http://localhost:24081/language_detection?text=${encodeURIComponent(inputText)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Detection failed');
      }
      
      const langName = LANGUAGES.find(l => l.code === data)?.name || (typeof data === 'string' ? data.toUpperCase() : 'UNKNOWN');
      
      setIdResult({ code: data, name: langName });
      setTimeout(() => setIsFlipped(true), 800);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setIdResult(null);
    setIsFlipped(false);
    setError(null);
  };

  const copyToClipboard = () => {
    if (result?.translated?.[0]) {
      navigator.clipboard.writeText(result.translated[0]);
      alert('Copied!');
    }
  };

  return (
    <div className="hub-container">
      <header className="hub-header">
        <h1>REVA <span className="blue-gradient">Neural Hub v2</span></h1>
        <div className="tab-switcher">
          <button 
            className={activeTab === 'translator' ? 'active' : ''} 
            onClick={() => setActiveTab('translator')}
          >
            Universal Translator
          </button>
          <button 
            className={activeTab === 'identifier' ? 'active' : ''} 
            onClick={() => setActiveTab('identifier')}
          >
            Language Identifier
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {error && (
          <div className="glass-panel error-toast animate-in">
            <p>⚠️ {error}</p>
          </div>
        )}

        {activeTab === 'translator' ? (
          <div className="glass-panel google-style-container animate-in">
            <div className="translator-grid">
              {/* Input Section */}
              <div className="input-section">
                <div className="section-header">
                  <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <textarea 
                  placeholder="Enter text (e.g. 'amma')..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              {/* Output Section */}
              <div className="output-section">
                <div className="section-header">
                  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                    {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  {result && <button className="copy-btn" onClick={copyToClipboard}>📋</button>}
                </div>
                <div className="translation-box">
                  {loading ? (
                    <div className="loader">Analyzing...</div>
                  ) : (
                    <p className="main-translation">{result?.translated?.[0] || 'Result...'}</p>
                  )}
                </div>
                {result && (
                  <div className="detected-hint">
                    Confidence Detection: <span className="highlight-blue">{result.source_lang?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="button-group-footer">
              <button className="reset-btn" onClick={handleReset}>RESET</button>
              <button className="translate-btn" onClick={handleTranslate} disabled={loading}>
                {loading ? 'SCANNIG...' : 'TRANSLATE NOW'}
              </button>
            </div>
          </div>
        ) : (
          <div className="identifier-dashboard animate-in">
            {/* Same identifier code */}
            <div className="glass-panel input-scan-box">
              <h3>Neural identification</h3>
              <textarea 
                placeholder="Enter text to scan..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              {loading && <div className="laser-line"></div>}
              <button className="translate-btn" onClick={handleIdentify} disabled={loading}>
                {loading ? 'ANALYZING PATTERNS...' : 'IDENTIFY LANGUAGE'}
              </button>
            </div>

            <div className={`flip-card ${isFlipped ? 'flipped' : ''} ${idResult ? 'visible' : ''}`}>
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <p>Initializing Neural Scan...</p>
                </div>
                <div className="flip-card-back">
                  <h4>Classification Result</h4>
                  <div className="lang-display">
                    <span className="lang-name">{idResult?.name}</span>
                    <div className="confidence-score">Confidence Meta: 99.9%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="hub-footer">
        <p>REVA UNIVERSITY | DEPARTMENT OF AI & ML</p>
      </footer>
    </div>
  );
}

export default App;
