import { useState, useEffect } from 'react';
import './App.css';

// --- TYPES ---
interface StatData { level: number; xp: number; }
interface Stats { [key: string]: StatData; }
interface ProtocolAction { name: string; xp: number; load: number; }
interface Protocols { [key: string]: ProtocolAction[]; }
interface Perk { title: string; desc: string; }
interface EmergenceTree { [key: string]: { [level: number]: Perk; }; }
interface LevelUpData { category: string; level: number; title: string; desc: string; }

type DuressMode = 'NONE' | 'ANXIETY' | 'DEPRESSION';

// --- DATA: EMERGENCE TREE ---
const EMERGENCE_TREE: EmergenceTree = {
  Structure: { 
    2: { title: "CONSTRAINT TIGHTENING", desc: "Systemet har etablerat nya gränser. Det krävs mindre energi att välja rörelse." },
    3: { title: "SCAFFOLDING ROBUSTNESS", desc: "Den fysiska strukturen kan bära tyngre kognitiva laster utan kollaps." },
    4: { title: "ADAPTIVE CAPACITY", desc: "Kroppen är nu en möjliggörare för oplanerade handlingar." }
  },
  Yield: { 
    2: { title: "COHERENCE INCREASED", desc: "Signal-brus-förhållandet optimerat. Lättare att se mönster i kaos." },
    3: { title: "EXAPTATION READY", desc: "Gamla idéer kan användas på nya sätt. Systemet redo för innovation." },
    4: { title: "OBLIQUITY", desc: "Resultat uppnås indirekt. Fokus på processen ger produkten som bieffekt." }
  },
  Sense: { 
    2: { title: "WEAK SIGNAL DETECTION", desc: "Du uppfattar avvikelser i omgivningen innan de blir kriser." },
    3: { title: "ABDUCTIVE REASONING", desc: "Förmågan att gissa kvalificerat baserat på ofullständig data har ökat." },
    4: { title: "SENSE-MAKING FLUIDITY", desc: "Du navigerar snabbare mellan ordning och komplexitet." }
  },
  Tuning: { 
    2: { title: "DAMPENING FEEDBACK", desc: "Negativa loopar dämpas snabbare. Återgång till jämvikt." },
    3: { title: "HEURISTICS UPGRADE", desc: "Tumreglerna för beslut förfinade. Du behöver inte tänka, du 'vet'." }
  },
  Energy: { 
    2: { title: "COUPLING WITH NATURE", desc: "Systemgränsen luckras upp. Utbyte av energi effektiviseras." },
    3: { title: "METABOLIC FLEXIBILITY", desc: "Systemet växlar bränslekälla utan prestandaförlust." },
    4: { title: "REGENERATIVE LOOPS", desc: "Output från en process blir input i nästa." }
  },
  Morale: { 
    2: { title: "ATTRACTOR STATE", desc: "Din närvaro stabiliserar andra system (människor) i närheten." },
    3: { title: "SOCIAL ENTANGLEMENT", desc: "Du påverkar nätverket genom att bara vara en nod i det." }
  }
};

const PROTOCOLS: Protocols = {
  Structure: [
    { name: "Gym / Styrka", xp: 25, load: -5 },
    { name: "Promenad", xp: 15, load: -10 },
    { name: "Ergonomi-check", xp: 10, load: 0 }
  ],
  Yield: [
    { name: "Deep Work", xp: 25, load: 10 },
    { name: "Admin / Mail", xp: 10, load: 5 },
    { name: "Visualisering", xp: 15, load: 5 }
  ],
  Sense: [
    { name: "Läsa fackbok", xp: 15, load: -2 },
    { name: "Reflektion", xp: 20, load: -15 },
    { name: "Systemanalys", xp: 15, load: 5 }
  ],
  Tuning: [
    { name: "Planera dagen", xp: 15, load: -5 },
    { name: "Rensa 'Noise'", xp: 10, load: -2 },
    { name: "Buffertspar", xp: 15, load: 0 }
  ],
  Energy: [
    { name: "Trädgård", xp: 30, load: -20 },
    { name: "Äta Protein", xp: 15, load: -5 },
    { name: "Vila / Vatten", xp: 10, load: 0 }
  ],
  Morale: [
    { name: "Socialt", xp: 15, load: 5 },
    { name: "Vårda relation", xp: 20, load: -5 },
    { name: "Klä sig snyggt", xp: 15, load: 0 }
  ]
};

export default function App() {
  // STATE
  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem('vsm-stats');
    let parsed = saved ? JSON.parse(saved) : null;
    const defaults: Stats = {
      Structure: { level: 1, xp: 10 },
      Yield: { level: 1, xp: 5 },
      Sense: { level: 1, xp: 8 },
      Tuning: { level: 1, xp: 3 },
      Energy: { level: 1, xp: 12 },
      Morale: { level: 1, xp: 4 }
    };
    if (!parsed) return defaults;
    // @ts-ignore
    if (typeof parsed.Structure === 'number') { 
       const migrated: Stats = {};
       // @ts-ignore
       Object.keys(parsed).forEach(k => migrated[k] = { level: 1, xp: parsed[k] });
       return migrated;
    }
    return parsed;
  });

  const [load, setLoad] = useState<number>(() => {
    const saved = localStorage.getItem('vsm-load');
    return saved ? JSON.parse(saved) : 20;
  });
  
  const [duressMode, setDuressMode] = useState<DuressMode>('NONE');
  const [logs, setLogs] = useState<string[]>(["SYSTEM ONLINE.", "AWAITING INPUT."]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  useEffect(() => {
    localStorage.setItem('vsm-stats', JSON.stringify(stats));
    localStorage.setItem('vsm-load', JSON.stringify(load));
  }, [stats, load]);

  // LOGIK
  const addLog = (text: string) => {
    setLogs(prev => [text, ...prev].slice(0, 5));
  };

  const executeProtocol = (category: string, action: ProtocolAction) => {
    const multiplier = duressMode !== 'NONE' ? 2 : 1;
    const finalXp = action.xp * multiplier;
    
    setLoad(prev => Math.max(0, Math.min(100, prev + action.load)));

    setStats(prev => {
      const currentStat = prev[category];
      let newXp = currentStat.xp + finalXp;
      let newLevel = currentStat.level;
      let leveledUp = false;
      let perkInfo: Perk = { title: "SYSTEM OPTIMIZED", desc: "Capacity increased." };

      if (newXp >= 100) {
        newXp = newXp - 100;
        newLevel += 1;
        leveledUp = true;
        const perk = EMERGENCE_TREE[category]?.[newLevel];
        if (perk) perkInfo = perk;
      }

      if (leveledUp) {
        setLevelUpData({ category, level: newLevel, ...perkInfo });
        addLog(`>>> EMERGENCE: ${category} LEVEL ${newLevel} <<<`);
      } else {
         let suffix = "";
         if (duressMode === 'ANXIETY') suffix = " [NOISE DAMPENED]";
         if (duressMode === 'DEPRESSION') suffix = " [INERTIA BROKEN]";
         
         const bonusText = multiplier > 1 ? ` (+${finalXp} XP)` : "";
         addLog(`> ${action.name.toUpperCase()} DONE.${suffix}${bonusText}`);
      }

      return { ...prev, [category]: { level: newLevel, xp: newXp } };
    });
    
    setActiveMenu(null);
  };

  // --- REACTION FUNCTIONS ---
  
  const handleJamSignal = () => {
    // Motstånd: Kostar lite energi att blockera, men minskar Load.
    setLoad(prev => Math.max(0, prev - 5));
    addLog("> SIGNAL JAMMED. RESISTANCE SUCCESSFUL.");
  };

  const handleAcceptance = () => {
    // Acceptans: Släpper igenom signalen utan att reagera. Minskar Load genom dämpning.
    // Vi kan också ge lite Tuning-XP här om vi vill, men håller det enkelt nu.
    setLoad(prev => Math.max(0, prev - 5));
    addLog("> SIGNAL ACKNOWLEDGED. INTEGRATION COMPLETE.");
  };

  const cycleEntropy = () => {
    // Deprecated. But keeping logic if needed later.
  };

  // UI Helpers
  const getContainerClass = () => {
    if (duressMode === 'ANXIETY') return 'mode-anxiety';
    if (duressMode === 'DEPRESSION') return 'mode-depression';
    return '';
  };

  const getLoadBarColor = () => {
    if (duressMode === 'ANXIETY') return '#ff3333';
    if (duressMode === 'DEPRESSION') return '#00ccff';
    return '#33ff00';
  };

  return (
    <div className={`main ${getContainerClass()}`}>
      <div className="scanlines"></div>
      
      <div className="container">
        <h1>V.S.M. LINK [OPERATOR: VÄXTMÄSTER]</h1>

        {/* LOAD */}
        <div style={{marginBottom: '20px'}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
             <span className={load > 80 ? "load-text" : ""}>
               SYSTEM LOAD: {load}% 
               {duressMode === 'ANXIETY' && " [HIGH FREQ]"}
               {duressMode === 'DEPRESSION' && " [LOW FREQ]"}
             </span>
             <span>{load > 80 ? "CRITICAL" : "STABLE"}</span>
          </div>
          <div className={`progress-bar load-bar`}>
            <div 
              className="fill" 
              style={{
                width: `${load}%`, 
                backgroundColor: getLoadBarColor(),
                boxShadow: `0 0 10px ${getLoadBarColor()}`
              }}
            ></div>
          </div>
        </div>

        {/* DURESS CONTROLS */}
        <div className="duress-container">
          <button 
            className={`duress-btn anxiety ${duressMode === 'ANXIETY' ? 'active' : ''}`}
            onClick={() => {
              setDuressMode(prev => prev === 'ANXIETY' ? 'NONE' : 'ANXIETY');
              addLog(duressMode !== 'ANXIETY' ? "> PROTOCOL: DAMPENING (ANXIETY)" : "> SYSTEM NORMALIZED.");
            }}
          >
            [ DAMPEN CHAOS ]
          </button>
          
          <button 
            className={`duress-btn depression ${duressMode === 'DEPRESSION' ? 'active' : ''}`}
            onClick={() => {
              setDuressMode(prev => prev === 'DEPRESSION' ? 'NONE' : 'DEPRESSION');
              addLog(duressMode !== 'DEPRESSION' ? "> PROTOCOL: IGNITION (STASIS)" : "> SYSTEM NORMALIZED.");
            }}
          >
            [ BREAK STASIS ]
          </button>
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

        {/* REACTION CONTROLS (NEW) */}
        <div className="reaction-container">
          <button className="glitch-btn" onClick={handleJamSignal}>
            [ JAM / RESIST ]
          </button>
          <button className="accept-btn" onClick={handleAcceptance}>
            [ ACCEPT / INTEGRATE ]
          </button>
        </div>

        <div className="log-window" style={{marginTop:'20px'}}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        {/* --- LEVEL UP MODAL --- */}
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
              
              {duressMode !== 'NONE' && (
                <p style={{
                  color: duressMode === 'ANXIETY' ? '#ff3333' : '#00ccff', 
                  textAlign:'center', 
                  fontWeight:'bold'
                }}>
                  ⚠️ DURESS BONUS ACTIVE (2X XP)
                </p>
              )}

              {PROTOCOLS[activeMenu].map((action, index) => {
                const isStrain = action.load > 0;
                const isRecovery = action.load < 0;
                let loadClass = "";
                if (action.load >= 10) loadClass = "strain-high";
                else if (action.load > 0) loadClass = "strain-low";
                else if (action.load < 0) loadClass = "recovery";
                
                const displayXp = duressMode !== 'NONE' ? action.xp * 2 : action.xp;
                const xpColor = duressMode === 'ANXIETY' ? '#ff3333' : (duressMode === 'DEPRESSION' ? '#00ccff' : '#fff');

                return (
                  <button key={index} className="action-btn" onClick={() => executeProtocol(activeMenu, action)}>
                    <span>{action.name.toUpperCase()}</span>
                    <div className="action-details">
                      <div style={{color: xpColor, fontWeight: duressMode !== 'NONE' ? 'bold' : 'normal'}}>
                        +{displayXp} XP
                      </div>
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
