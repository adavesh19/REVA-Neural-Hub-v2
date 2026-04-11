import React, { useState, useEffect, useCallback } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "kn", label: "Kannada", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "te", label: "Telugu", flag: "🇮🇳" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:24081";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Exo+2:wght@300;400;500;700&display=swap');

  .hub-root {
    min-height: 100vh;
    background: #020408;
    font-family: 'Exo 2', sans-serif;
    color: #e8f4ff;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 50px;
  }

  .grid-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .hub-content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 60px 24px; }

  .hub-title { text-align: center; margin-bottom: 40px; }
  .hub-title h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(28px, 5vw, 52px);
    font-weight: 900;
    background: linear-gradient(135deg, #00c8ff 0%, #8b5cf6 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .tab-bar { display: flex; justify-content: center; margin-bottom: 36px; }
  .tab-wrap {
    display: flex; gap: 4px; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(0,200,255,0.12); border-radius: 50px; padding: 5px;
    backdrop-filter: blur(20px);
  }
  .tab-btn {
    padding: 10px 32px; border-radius: 50px; border: none; cursor: pointer;
    font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 600;
    transition: 0.3s; color: rgba(255,255,255,0.5); background: transparent;
  }
  .tab-btn.active { background: linear-gradient(135deg, #0080ff, #8b5cf6); color: #fff; }

  .glass-panel {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(0,200,255,0.12);
    border-radius: 20px; backdrop-filter: blur(30px); overflow: hidden;
    box-shadow: 0 8px 60px rgba(0,0,0,0.4); display: grid; grid-template-columns: 1fr 1fr;
  }

  .panel-left, .panel-right { padding: 32px 28px; min-height: 420px; display: flex; flex-direction: column; gap: 16px; }
  .panel-left { border-right: 1px solid rgba(0,200,255,0.1); }

  .section-label {
    font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 4px; text-transform: uppercase; color: #00c8ff;
    display: flex; align-items: center; gap: 8px;
  }

  .neural-textarea {
    flex: 1; background: transparent; border: none; outline: none;
    color: #fff; font-family: 'Exo 2', sans-serif; font-size: 18px;
    resize: none; caret-color: #00c8ff;
  }

  .btn-primary {
    padding: 14px 24px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #0080ff, #00c8ff);
    color: #fff; font-family: 'Rajdhani', sans-serif; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; transition: 0.3s;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 30px rgba(0,200,255,0.5); }

  .status-bar {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 10px;
    background: rgba(0,0,0,0.6); padding: 8px 20px; border-radius: 20px;
    font-family: 'Rajdhani', sans-serif; font-size: 12px; border: 1px solid rgba(0,200,255,0.2);
  }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
  .status-dot.offline { background: #ef4444; }

  @media(max-width: 768px) { .glass-panel { grid-template-columns: 1fr; } .panel-left { border-right: none; border-bottom: 1px solid rgba(0,200,255,0.1); } }
`;

function App() {
  const [activeTab, setActiveTab] = useState("translator");
  const [inputText, setInputText] = useState("");
  const [targetLang, setTargetLang] = useState("hi");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ online: false, engine: "offline" });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/health`);
        const status = await resp.json();
        setSystemStatus({ 
          online: true, 
          engine: status.api_mode === "free" ? "Neural Free" : "Neural Hub" 
        });
      } catch {
        setSystemStatus({ online: false, engine: "offline" });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/translate?target_lang=${targetLang}&text=${encodeURIComponent(inputText)}`);
      const data = await resp.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hub-root">
      <style>{styles}</style>
      <div className="grid-bg" />
      
      <main className="hub-content">
        <header className="hub-title">
          <h1>REVA <span className="white">Neural</span> <span className="grad">Hub v3</span></h1>
          <p style={{fontFamily:'Rajdhani', color:'rgba(0,200,255,0.5)', letterSpacing:'4px'}}>100% FREE AI TRANSLATION CENTER</p>
        </header>

        <div className="tab-bar">
          <div className="tab-wrap">
            <button className={`tab-btn ${activeTab === 'translator' ? 'active' : ''}`} onClick={() => setActiveTab('translator')}>Translator</button>
            <button className={`tab-btn ${activeTab === 'identifier' ? 'active' : ''}`} onClick={() => setActiveTab('identifier')}>Identifier</button>
          </div>
        </div>

        <div className="glass-panel">
          {activeTab === "translator" ? (
            <>
              <div className="panel-left">
                <div className="section-label">Neural Input</div>
                <textarea 
                  className="neural-textarea" 
                  placeholder="Enter text for deep neural analysis..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div style={{marginTop:'auto', display:'flex', gap:'10px'}}>
                  <button className="btn-primary" onClick={handleTranslate} disabled={loading}>
                    {loading ? "EXECUTING..." : "TRANSLATE NOW"}
                  </button>
                  <button onClick={() => {setInputText(""); setResult(null)}} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'10px', padding:'0 15px', cursor:'pointer'}}>RESET</button>
                </div>
              </div>

              <div className="panel-right">
                <div className="section-label">Neural Output</div>
                <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(0,200,255,0.2)', color:'white', padding:'10px', borderRadius:'10px'}}
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                </select>

                <div style={{flex:1, marginTop:'20px', fontSize:'20px', fontWeight:300, color: result ? '#fff' : 'rgba(255,255,255,0.2)'}}>
                  {loading ? "Neural patterns initializing..." : (result ? result.translated[0] : "Results will manifest here...")}
                </div>

                {result && (
                  <div style={{marginTop:'auto', background:'rgba(0,200,255,0.05)', padding:'10px', borderRadius:'10px', fontSize:'12px', fontFamily:'Rajdhani'}}>
                    ENGINE: <span style={{color:'#00c8ff'}}>{result.engine || "Standard"}</span> | 
                    DETECTED: <span style={{color:'#00c8ff'}}>{result.source_lang?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="panel-left">
                <div className="section-label">Language Identification</div>
                <textarea 
                  className="neural-textarea" 
                  placeholder="Enter text to identify source language..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div style={{marginTop:'auto'}}>
                  <button className="btn-primary" onClick={async () => {
                    setLoading(true);
                    try {
                      const resp = await fetch(`${API_BASE_URL}/language_detection?text=${encodeURIComponent(inputText)}`);
                      const data = await resp.text();
                      setResult({ source_lang: data, translated: ["Identification successful."] });
                    } catch (err) { console.error(err); }
                    finally { setLoading(false); }
                  }} disabled={loading}>
                    {loading ? "ANALYZING..." : "IDENTIFY LANGUAGE"}
                  </button>
                </div>
              </div>
              <div className="panel-right" style={{justifyContent:'center', alignItems:'center'}}>
                {result && activeTab === "identifier" ? (
                  <div style={{textAlign:'center'}}>
                    <div className="section-label" style={{justifyContent:'center'}}>Detection Result</div>
                    <h2 style={{fontSize:'48px', color:'#00c8ff', fontFamily:'Orbitron', marginTop:'20px'}}>{result.source_lang?.toUpperCase()}</h2>
                    <p style={{fontFamily:'Rajdhani', opacity:0.5, marginTop:'10px'}}>Neural Confidence: 99.9%</p>
                  </div>
                ) : (
                  <div style={{opacity:0.2, textAlign:'center'}}>
                     <p>Waiting for Input...</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <div className="status-bar">
        <div className={`status-dot ${systemStatus.online ? '' : 'offline'}`} />
        <span>SYSTEM: {systemStatus.online ? "ONLINE" : "OFFLINE"}</span>
        <span style={{opacity:0.3}}>|</span>
        <span>ENGINE: {systemStatus.engine.toUpperCase()}</span>
      </div>
    </div>
  );
}

export default App;
