import React, { useState, useEffect } from 'react';
import './App.css';

// --- 1. DATA: EMERGENCE TREE (Dina Perks / Insikter) ---
const EMERGENCE_TREE = {
  Structure: { // Fysik / Hälsa
    2: { title: "MYOFIBRIL ADAPTATION", desc: "Muskelminne etablerat. Startmotståndet för träning har minskat." },
    3: { title: "SKELETAL INTEGRITY", desc: "Hållningen förbättrad. Ergonomisk belastning ger mindre slitage." },
    4: { title: "IRON TEMPLE", desc: "Kroppen ber om aktivitet istället för att undvika den." }
  },
  Yield: { // Produktivitet / Skrivande
    2: { title: "THE HEMINGWAY BRIDGE", desc: "Förmågan att sluta när du vet vad som kommer härnäst." },
    3: { title: "FLOW STATE ACCESS", desc: "Tiden för att nå djupt fokus har halverats." },
    4: { title: "CONCEPTUAL DENSITY", desc: "Du säger mer med färre ord. Textens densitet har ökat." }
  },
  Sense: { // Lärande / Systemförståelse
    2: { title: "PATTERN RECOGNITION", desc: "Du ser systemfel innan de inträffar." },
    3: { title: "CYBERNETIC LOOP", desc: "Feedback från omvärlden integreras nu automatiskt." },
    4: { title: "META-COGNITION", desc: "Du tänker på hur du tänker medan du tänker." }
  },
  Tuning: { // Balans / Planering
    2: { title: "NOISE FILTER", desc: "Irrelevanta signaler filtreras bort automatiskt." },
    3: { title: "AGILE ADAPTATION", desc: "Schemat är inte längre en lag, utan en hypotes." }
  },
  Energy: { // Kost / Trädgård
    2: { title: "PHOTOSYNTHESIS", desc: "Vistelse i zon 3 (Uppsala) laddar batterierna 20% snabbare." },
    3: { title: "GASTRIC RHYTHM", desc: "Du känner kroppens signaler innan energin dippar." },
    4: { title: "BIOMASS RECYCLING", desc: "Allt är näring. Även motgångar komposteras till växtkraft." }
  },
  Morale: { // Socialt
    2: { title: "SIGNAL CLARITY", desc: "Din kommunikation når fram utan brus." },
    3: { title: "SOCIAL BATTERY EXTENDED", desc: "Interaktion drar mindre energi." }
  }
};

// --- 2. DATA: PROTOCOLS (Dina Handlingar) ---
const PROTOCOLS = {
  Structure: [
    { name: "Gym / Styrka", xp: 25, load: -5 }, // Ökat XP för test
    { name: "Promenad", xp: 15, load: -10 },
    { name: "Ergonomi-check", xp: 10, load: 0 }
  ],
  Yield: [
    { name: "Deep Work (Skriva)", xp: 25, load: 10 },
    { name: "Admin / E-mail", xp: 10, load: 5 },
    { name: "Visualisera Problem", xp: 15, load: 5 }
  ],
  Sense: [
    { name: "Läsa fackbok", xp: 15, load: -2 },
    { name: "Reflektion / Dagbok", xp: 20, load: -15 },
    { name: "Systemanalys", xp: 15, load: 5 }
  ],
  Tuning: [
    { name: "Planera dagen", xp: 15, load: -5 },
    { name: "Rensa 'Noise'", xp: 10, load: -2 },
    { name: "Spara till Buffert", xp: 15, load: 0 }
  ],
  Energy: [
    { name: "Trädgård (Biomassa)", xp: 30, load: -20 },
    { name: "Äta Protein", xp: 15, load: -5 },
    { name: "Vila / Hydrering", xp: 10, load: 0 }
  ],
  Morale: [
    { name: "Social interaktion", xp: 15, load: 5 },
    { name: "Vårda relation", xp: 20, load: -5 },
    { name: "Klä sig snyggt", xp: 15, load: 0 }
  ]
};

export default function App() {
  
  // SETUP
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('vsm-stats');
    let parsed = saved ? JSON.parse(saved) : null;
    const defaults = {
      Structure: { level: 1, xp: 10 },
      Yield: { level: 1, xp: 5 },
      Sense: { level: 1, xp: 8 },
      Tuning: { level: 1, xp: 3 },
      Energy: { level: 1, xp: 12 },
      Morale: { level: 1, xp: 4 }
    };
    if (!parsed) return defaults;
    if (typeof parsed.Structure === 'number') { // Migrering
       const migrated = {};
       Object.keys(parsed).forEach(k => migrated[k] = { level: 1, xp: parsed[k] });
       return migrated;
    }
    return parsed;
  });

  const [load, setLoad] = useState(() => {
    const saved = localStorage.getItem('vsm-load');
    return saved ? JSON.parse(saved) : 20;
  });
  
  const [logs, setLogs] = useState(["SYSTEM ONLINE.", "AWAITING INPUT."]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null); // { category, level, perkTitle, perkDesc }

  useEffect(() => {
    localStorage.setItem('vsm-stats', JSON.stringify(stats));
    localStorage.setItem('vsm-load', JSON.stringify(load));
  }, [stats, load]);

  // LOGIK
  const addLog = (text) => {
    setLogs(prev => [text, ...prev].slice(0, 5));
  };

  const executeProtocol = (category, action) => {
    setLoad(prev => Math.max(0, Math.min(100, prev + action.load)));

    setStats(prev => {
      const currentStat = prev[category];
      let newXp = currentStat.xp + action.xp;
      let newLevel = currentStat.level;
      let leveledUp = false;
      let perkInfo = null;

      if (newXp >= 100) {
        newXp = newXp - 100;
        newLevel += 1;
        leveledUp = true;
        
        // Hämta perk från trädet
        const perk = EMERGENCE_TREE[category]?.[newLevel];
        if (perk) {
          perkInfo = perk;
        } else {
          perkInfo = { title: "SYSTEM OPTIMIZED", desc: "Capacity increased." };
        }
      }

      if (leveledUp) {
        setLevelUpData({ category, level: newLevel, ...perkInfo });
        addLog(`>>> EMERGENCE: ${category.toUpperCase()} IS NOW LEVEL ${newLevel} <<<`);
      } else {
         const type = action.load > 0 ? "STRAIN" : "RECOVERY";
         addLog(`> ${action.name.toUpperCase()} DONE. (${type})`);
      }

      return { ...prev, [category]: { level: newLevel, xp: newXp } };
    });
    
    setActiveMenu(null);
  };

  const handleJamSignal = () => {
    setLoad(prev => Math.max(0, prev - 5));
    addLog("> SIGNAL JAMMED. RESISTANCE XP GAINED.");
  };

  const cycleEntropy = () => {
    setLoad(prev => Math.min(100, prev + 10));
    addLog("> CYCLE ADVANCED. ENTROPY +10.");
  };

  return (
    <div className="main">
      <div className="scanlines"></div>
      
      <div className="container">
        <h1>V.S.M. LINK [OPERATOR: VÄXTMÄSTER]</h1>

        {/* LOAD */}
        <div style={{marginBottom: '20px'}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
             <span className={load > 80 ? "load-text" : ""}>SYSTEM LOAD: {load}%</span>
             <span>{load > 80 ? "CRITICAL" : "STABLE"}</span>
          </div>
          <div className={`progress-bar load-bar`}>
            <div className="fill" style={{width: `${load}%`}}></div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          {Object.keys(stats).map((key) => {
            const stat = stats[key];
            return (
              <div key={key} className="meter-container">
                <span style={{width: '90px', fontSize:'0.9rem'}}>
                  <span className="stat-level-badge">L{stat.level}</span>
                  {key.substring(0,3).toUpperCase()}
                </span>
                <div className="progress-bar" style={{width: '120px'}}>
                  <div className="fill" style={{width: `${stat.xp}%`}}></div>
                </div>
                <button onClick={() => setActiveMenu(key)}>[ SELECT ]</button>
              </div>
            );
          })}
        </div>

        {/* CONTROLS */}
        <button className="glitch-btn" onClick={handleJamSignal}>
          [ JAM SIGNAL / RESIST ]
        </button>

        <div style={{marginTop: '20px', textAlign: 'center'}}>
           <button onClick={cycleEntropy}>[ &gt;&gt; ADVANCE CYCLE &gt;&gt; ]</button>
        </div>

        <div className="log-window">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        {/* --- LEVEL UP MODAL (NEW) --- */}
        {levelUpData && (
          <div className="levelup-overlay" onClick={() => setLevelUpData(null)}>
            <div className="levelup-box">
              <h2 className="levelup-title">EMERGENCE DETECTED!</h2>
              
              <div style={{marginBottom:'20px'}}>
                {levelUpData.category.toUpperCase()} UPGRADED TO <br/>
                <span style={{fontSize: '3rem', color:'#fff'}}>LEVEL {levelUpData.level}</span>
              </div>
              
              <div style={{borderTop:'1px dashed #33ff00', borderBottom:'1px dashed #33ff00', padding:'15px', margin:'10px 0'}}>
                <h3 style={{margin:'0 0 5px 0', color:'#fff'}}>{levelUpData.title}</h3>
                <p style={{margin:0, fontStyle:'italic', color:'#8f8'}}>
                  "{levelUpData.desc}"
                </p>
              </div>

              <p style={{color: '#888', marginTop:'20px'}}>[ TAP TO INTEGRATE ]</p>
            </div>
          </div>
        )}

        {/* --- ACTION MENU --- */}
        {activeMenu && !levelUpData && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>INITIATE {activeMenu.toUpperCase()}</h2>
              {PROTOCOLS[activeMenu].map((action, index) => {
                const isStrain = action.load > 0;
                const isRecovery = action.load < 0;
                let loadClass = "";
                if (action.load >= 10) loadClass = "strain-high";
                else if (action.load > 0) loadClass = "strain-low";
                else if (action.load < 0) loadClass = "recovery";

                return (
                  <button key={index} className="action-btn" onClick={() => executeProtocol(activeMenu, action)}>
                    <span>{action.name.toUpperCase()}</span>
                    <div className="action-details">
                      <div style={{color: '#fff'}}>+{action.xp} XP</div>
                      <div className={loadClass}>
                        {isStrain ? `COST: ${action.load}` : ''}
                        {isRecovery ? `HEAL: ${Math.abs(action.load)}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button className="action-btn cancel-btn" style={{justifyContent:'center'}} onClick={() => setActiveMenu(null)}>
                [ CANCEL ]
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}