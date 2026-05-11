// Extra screens: Onboarding, NewTrip, Members, Activity, Stats, Profile, Discussion
const { useState: useStateE, useEffect: useEffectE } = React;

// ─── Bottom nav (shown on Trips list, Activity, Stats, Profile) ──
function BottomNav({ current, onChange, onNew }) {
  const tabs = [
    { id:'trips',    label:'Voyages',  icon: IcMap },
    { id:'activity', label:'Activité', icon: IcBell },
    { id:'stats',    label:'Stats',    icon: IcChart },
    { id:'profile',  label:'Profil',   icon: IcUser },
  ];
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:0, paddingBottom: HOME_H, zIndex:20,
      background:'rgba(255,255,255,0.92)', backdropFilter:'blur(14px) saturate(180%)',
      WebkitBackdropFilter:'blur(14px) saturate(180%)',
      borderTop:`1px solid ${PAL.line}`,
    }}>
      <div style={{ display:'flex', padding:'8px 8px 6px', position:'relative' }}>
        {tabs.map((t, i) => {
          const active = current === t.id;
          const Ic = t.icon;
          if (i === 2) {
            // inject FAB in the middle
            return (
              <React.Fragment key="row">
                <NavBtn key={t.id} t={t} Ic={Ic} active={active} onChange={onChange} />
              </React.Fragment>
            );
          }
          return <NavBtn key={t.id} t={t} Ic={Ic} active={active} onChange={onChange} />;
        })}
      </div>
      {/* center FAB pinned over nav */}
      <button onClick={onNew} style={{
        position:'absolute', left:'50%', top:-22, transform:'translateX(-50%)',
        width:54, height:54, borderRadius:'50%', border:'none',
        background:PAL.ink, color:'#fff', cursor:'pointer',
        boxShadow:'0 10px 22px rgba(12,26,34,0.30), 0 0 0 5px rgba(244,244,249,0.95)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <IcPlus size={26} sw={2.2}/>
      </button>
    </div>
  );
}

function NavBtn({ t, Ic, active, onChange }) {
  return (
    <button onClick={() => onChange(t.id)} style={{
      flex:1, height:48, borderRadius:12, border:'none', background:'transparent',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
      color: active ? PAL.ink : PAL.ink3, cursor:'pointer',
    }}>
      <Ic size={20} sw={active ? 2.1 : 1.7} />
      <span style={{ fontSize:10, fontWeight: active ? 700 : 600, fontFamily:'Plus Jakarta Sans' }}>{t.label}</span>
    </button>
  );
}

// ─── Onboarding ──────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const [step, setStep] = useStateE(0);
  const slides = [
    {
      tone: PAL.ink,
      art: <OnboardArtPlan/>,
      kicker: 'Étape 1',
      title: 'Plan',
      head: 'Organisez chaque journée du voyage.',
      body: 'Itinéraire heure par heure, réservations partagées, et tout le monde reste à la même page.',
    },
    {
      tone: PAL.ink2,
      art: <OnboardArtSpend/>,
      kicker: 'Étape 2',
      title: 'Dépensez',
      head: 'Ajoutez une dépense en 3 secondes.',
      body: 'Photo du reçu, qui paie, qui partage. TraveloCount fait les calculs en temps réel.',
    },
    {
      tone: '#1F3E3A',
      art: <OnboardArtSettle/>,
      kicker: 'Étape 3',
      title: 'Équilibrez',
      head: 'Soldez tout en un virement.',
      body: "L'algo calcule le nombre minimum de transferts pour que personne ne doive rien à personne.",
    },
  ];
  const s = slides[step];

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background: s.tone, color:'#fff',
                  transition:'background 0.35s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 20px 0', alignItems:'center' }}>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.12em', opacity:0.55, fontWeight:600 }}>
          {String(step+1).padStart(2,'0')} / 0{slides.length}
        </div>
        <button onClick={onDone} style={{
          background:'rgba(255,255,255,0.12)', border:'none', borderRadius:99,
          color:'#fff', fontFamily:'Plus Jakarta Sans', fontWeight:600, fontSize:12, padding:'6px 12px',
          cursor:'pointer',
        }}>Passer</button>
      </div>

      <div style={{ flex:1, padding:'12px 24px 0', display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 0' }}>
          {s.art}
        </div>
        <div>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:11, opacity:0.6, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>
            {s.kicker} · {s.title}
          </div>
          <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:30, fontWeight:700, letterSpacing:'-0.025em', lineHeight:1.05, marginTop:8 }}>
            {s.head}
          </div>
          <div style={{ fontSize:14, opacity:0.72, marginTop:10, lineHeight:1.5, maxWidth:320 }}>
            {s.body}
          </div>
        </div>
      </div>

      <div style={{ padding:'18px 24px', paddingBottom: HOME_H + 18 }}>
        <div style={{ display:'flex', gap:6, marginBottom:18 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              height:4, borderRadius:99, transition:'all 0.3s',
              flex: i === step ? 2 : 1,
              background: i <= step ? PAL.accent : 'rgba(255,255,255,0.22)',
            }}/>
          ))}
        </div>
        <button onClick={() => step < slides.length - 1 ? setStep(step+1) : onDone()} style={{
          width:'100%', height:54, borderRadius:14, border:'none',
          background:PAL.accent, color:'#1F3E3A',
          fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:15,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer',
        }}>
          {step < slides.length - 1 ? <>Suivant <IcArrowR size={17} sw={2.2}/></> : <>Commencer <IcSparkle size={17} sw={1.9}/></>}
        </button>
      </div>
    </div>
  );
}

// Simple geometric SVG art for onboarding (avoid hand-drawn illustration)
const OnboardArtPlan = () => (
  <svg viewBox="0 0 280 240" width="280" height="240">
    <defs>
      <pattern id="dotgridOb" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill="#fff" opacity="0.18"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="280" height="240" fill="url(#dotgridOb)"/>
    {/* Stack of cards */}
    <g transform="translate(40,40)">
      <rect x="6" y="14" width="180" height="46" rx="14" fill={PAL.accent} opacity="0.55"/>
      <rect x="12" y="6" width="180" height="46" rx="14" fill={PAL.accent} opacity="0.8"/>
      <rect x="0" y="-2" width="200" height="56" rx="16" fill="#fff"/>
      <circle cx="22" cy="26" r="11" fill={PAL.accent}/>
      <rect x="42" y="18" width="100" height="6" rx="2" fill={PAL.ink}/>
      <rect x="42" y="30" width="60" height="5" rx="2" fill={PAL.ink3}/>
      <rect x="170" y="22" width="22" height="10" rx="3" fill={PAL.bg}/>
    </g>
    <g transform="translate(60,130)">
      <rect x="0" y="0" width="180" height="56" rx="16" fill="rgba(255,255,255,0.92)"/>
      <circle cx="22" cy="26" r="11" fill={PAL.ink2}/>
      <rect x="42" y="18" width="90" height="6" rx="2" fill={PAL.ink}/>
      <rect x="42" y="30" width="80" height="5" rx="2" fill={PAL.ink3}/>
    </g>
    {/* clock */}
    <g transform="translate(220,30)">
      <circle r="20" fill={PAL.accent}/>
      <path d="M0 -12 L0 0 L9 6" stroke={PAL.ink} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </g>
  </svg>
);

const OnboardArtSpend = () => (
  <svg viewBox="0 0 280 240" width="280" height="240">
    {/* receipt */}
    <g transform="translate(70,28)">
      <path d="M0,0 L140,0 L140,180 L120,170 L100,180 L80,170 L60,180 L40,170 L20,180 L0,170 Z"
            fill="#fff"/>
      <rect x="14" y="18" width="80" height="8" rx="2" fill={PAL.ink}/>
      <rect x="14" y="38" width="60" height="6" rx="2" fill={PAL.ink3}/>
      <line x1="14" y1="58" x2="126" y2="58" stroke={PAL.line2}/>
      {[0,1,2,3].map(i => (
        <g key={i} transform={`translate(14, ${72 + i*18})`}>
          <rect width="50" height="5" rx="2" fill={PAL.ink2}/>
          <rect x="80" width="32" height="5" rx="2" fill={PAL.ink2}/>
        </g>
      ))}
      <line x1="14" y1="150" x2="126" y2="150" stroke={PAL.line2}/>
      <rect x="14" y="158" width="40" height="7" rx="2" fill={PAL.ink}/>
      <rect x="86" y="158" width="40" height="7" rx="2" fill={PAL.ink}/>
    </g>
    {/* coins */}
    <circle cx="62" cy="178" r="18" fill={PAL.accent}/>
    <text x="62" y="184" textAnchor="middle" fill={PAL.ink} fontFamily="JetBrains Mono" fontSize="14" fontWeight="700">€</text>
    <circle cx="220" cy="60" r="14" fill={PAL.accent} opacity="0.6"/>
    <circle cx="232" cy="190" r="22" fill={PAL.accent}/>
    <text x="232" y="197" textAnchor="middle" fill={PAL.ink} fontFamily="JetBrains Mono" fontSize="16" fontWeight="700">€</text>
  </svg>
);

const OnboardArtSettle = () => (
  <svg viewBox="0 0 280 240" width="280" height="240">
    {/* 4 avatars connected */}
    {[
      { x:140, y:50, name:'M', bg:PAL.accent, fg:'#1F3E3A' },
      { x:226, y:120, name:'S', bg:'#fff', fg:PAL.ink },
      { x:140, y:190, name:'T', bg:PAL.accent, fg:'#1F3E3A' },
      { x:54, y:120, name:'L', bg:'#fff', fg:PAL.ink },
    ].map((a, i) => (
      <g key={i}>
        <line x1="140" y1="120" x2={a.x} y2={a.y} stroke={PAL.accent} strokeWidth="2" strokeDasharray="4 4" opacity="0.55"/>
      </g>
    ))}
    <circle cx="140" cy="120" r="34" fill={PAL.ink} stroke={PAL.accent} strokeWidth="3"/>
    <text x="140" y="127" textAnchor="middle" fill={PAL.accent} fontFamily="JetBrains Mono" fontSize="22" fontWeight="700">€</text>
    {[
      { x:140, y:50, name:'M', bg:PAL.accent, fg:'#1F3E3A' },
      { x:226, y:120, name:'S', bg:'#fff', fg:PAL.ink },
      { x:140, y:190, name:'T', bg:PAL.accent, fg:'#1F3E3A' },
      { x:54, y:120, name:'L', bg:'#fff', fg:PAL.ink },
    ].map((a, i) => (
      <g key={i}>
        <circle cx={a.x} cy={a.y} r="22" fill={a.bg}/>
        <text x={a.x} y={a.y+6} textAnchor="middle" fill={a.fg} fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700">{a.name}</text>
      </g>
    ))}
  </svg>
);

// ─── New Trip wizard ──────────────────────────────────────────
function NewTripWizard({ onClose, onCreate }) {
  const [step, setStep] = useStateE(0);
  const [title, setTitle] = useStateE('');
  const [destination, setDestination] = useStateE('');
  const [dates, setDates] = useStateE('');
  const [vibe, setVibe] = useStateE('city');
  const [budget, setBudget] = useStateE(400);
  const [invited, setInvited] = useStateE(['marc','sofia']);

  const vibes = [
    { id:'city',     label:'City break',    grad:'linear-gradient(135deg,#2F4550,#586F7C)' },
    { id:'mountain', label:'Montagne',      grad:'linear-gradient(135deg,#0C1A22,#2F4550)' },
    { id:'beach',    label:'Plage',         grad:'linear-gradient(135deg,#586F7C,#B8DBD9)' },
    { id:'roadtrip', label:'Road trip',     grad:'linear-gradient(135deg,#2F4550,#0C1A22)' },
  ];
  const currentVibe = vibes.find(v=>v.id===vibe);

  const steps = ['Voyage', 'Équipe', 'Budget'];

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:PAL.bg }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 6px' }}>
        <button onClick={() => step === 0 ? onClose() : setStep(step-1)} style={{
          width:36, height:36, borderRadius:12, border:'none', background:PAL.surface,
          color:PAL.ink, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          {step === 0 ? <IcX size={18} sw={2}/> : <IcArrowL size={18} sw={2}/>}
        </button>
        <div style={{ fontSize:13, fontWeight:700, color:PAL.ink }}>Nouveau voyage</div>
        <div style={{ width:36 }}/>
      </div>
      {/* Stepper */}
      <div style={{ padding:'6px 22px 18px' }}>
        <div style={{ display:'flex', gap:6 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex:1, height:4, borderRadius:99,
              background: i <= step ? PAL.ink : PAL.line2, transition:'background 0.3s',
            }}/>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              fontSize:10.5, fontWeight: i===step?700:600, color: i<=step?PAL.ink:PAL.ink3,
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>{i+1}· {s}</div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px' }}>
        {step === 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Cover preview */}
            <div style={{
              height:140, borderRadius:20, background:currentVibe.grad,
              position:'relative', overflow:'hidden',
              display:'flex', alignItems:'flex-end', padding:18,
            }}>
              <svg style={{ position:'absolute', inset:0, opacity:0.14 }} width="100%" height="100%">
                <defs><pattern id="dotgrid3" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill="#fff"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#dotgrid3)"/>
              </svg>
              <div style={{ position:'relative', color:'#fff' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'0.18em', opacity:0.7, fontWeight:600 }}>APERÇU · COUVERTURE</div>
                <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:22, fontWeight:700, marginTop:6, letterSpacing:'-0.02em' }}>
                  {title || 'Mon prochain voyage'}
                </div>
                <div style={{ fontSize:12, opacity:0.7, marginTop:2 }}>{dates || 'Dates à définir'}</div>
              </div>
            </div>

            <FieldGroup label="Titre du voyage">
              <FieldInput placeholder="Ex. Lisbonne en mai" value={title} onChange={setTitle} icon={<IcMap size={16} sw={1.8} style={{ color:PAL.ink3 }}/>} />
            </FieldGroup>

            <FieldGroup label="Destination">
              <FieldInput placeholder="Lisbonne, Portugal" value={destination} onChange={setDestination} icon={<IcPin size={16} sw={1.8} style={{ color:PAL.ink3 }}/>} />
            </FieldGroup>

            <FieldGroup label="Dates">
              <FieldInput placeholder="12 → 19 mai 2026" value={dates} onChange={setDates} icon={<IcCal size={16} sw={1.8} style={{ color:PAL.ink3 }}/>} />
            </FieldGroup>

            <FieldGroup label="Ambiance">
              <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
                {vibes.map(v => {
                  const a = v.id === vibe;
                  return (
                    <button key={v.id} onClick={()=>setVibe(v.id)} style={{
                      flexShrink:0, width:84, height:88, borderRadius:14, border:`2px solid ${a?PAL.ink:'transparent'}`,
                      background:v.grad, color:'#fff', cursor:'pointer', position:'relative', overflow:'hidden',
                      display:'flex', alignItems:'flex-end', padding:10,
                    }}>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:'Plus Jakarta Sans', textAlign:'left' }}>{v.label}</span>
                      {a && <div style={{ position:'absolute', top:6, right:6, width:18, height:18, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><IcCheck size={12} sw={2.6} style={{ color:PAL.ink }}/></div>}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>
          </div>
        )}

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Card>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Lien d'invitation</div>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:11.5, color:PAL.ink3, marginTop:4 }}>travelo.co/j/3K7-LIS</div>
                </div>
                <button style={{
                  background:PAL.ink, color:'#fff', border:'none', padding:'8px 12px', borderRadius:10,
                  fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:11.5, cursor:'pointer',
                }}>Copier</button>
              </div>
            </Card>
            <FieldGroup label={`Membres invités · ${invited.length + 1}`}>
              <Card padding={0}>
                {[ME, ...invited.map(memberById), {id:'add'}].map((m, i, arr) => {
                  if (m.id === 'add') {
                    return (
                      <div key="add" onClick={()=>setInvited([...invited,'tom'].filter((v,i,a)=>a.indexOf(v)===i))} style={{
                        display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer',
                      }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:PAL.bg, color:PAL.ink, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <IcPlus size={16} sw={2}/>
                        </div>
                        <div style={{ flex:1, fontSize:13.5, fontWeight:600, color:PAL.ink3 }}>Ajouter un membre</div>
                        <IcArrowR size={14} sw={2} style={{ color:PAL.ink3 }}/>
                      </div>
                    );
                  }
                  return (
                    <React.Fragment key={m.id}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                        <Avatar id={m.id} size={32}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13.5, fontWeight:700, color:PAL.ink }}>{m.id==='lea'?'Toi':m.name}</div>
                          <div style={{ fontSize:11, color:PAL.ink3, fontWeight:500, marginTop:1 }}>{m.id==='lea'?'Organisatrice':'Invité·e'}</div>
                        </div>
                        <Chip tone={m.id==='lea'?'accent':'ghost'} size="sm">{m.id==='lea'?'Admin':'En attente'}</Chip>
                      </div>
                      {i < arr.length - 1 && <Divider inset={56}/>}
                    </React.Fragment>
                  );
                })}
              </Card>
            </FieldGroup>
            <Card style={{ background:PAL.accent }}>
              <div style={{ display:'flex', gap:10 }}>
                <IcUsers size={18} sw={1.9} style={{ color:'#1F3E3A', flexShrink:0, marginTop:2 }}/>
                <div style={{ fontSize:12.5, color:'#1F3E3A', lineHeight:1.45, fontWeight:500 }}>
                  Les membres pourront ajouter leurs propres dépenses. Les soldes se mettent à jour en temps réel.
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Card>
              <div style={{ fontSize:11, color:PAL.ink3, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Budget par personne</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:8 }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:44, fontWeight:600, color:PAL.ink, letterSpacing:'-0.04em' }}>{budget}</span>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:22, fontWeight:500, color:PAL.ink3 }}>€</span>
              </div>
              <input type="range" min="100" max="2000" step="20" value={budget} onChange={e=>setBudget(+e.target.value)} style={{ width:'100%', marginTop:12, accentColor:PAL.ink }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'JetBrains Mono', fontSize:10.5, color:PAL.ink3, fontWeight:500 }}>
                <span>100€</span><span>2000€</span>
              </div>
              <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${PAL.line}`, display:'flex', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:11, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Total groupe</div>
                  <Money value={budget*(invited.length+1)} size={20} weight={700} color={PAL.ink}/>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Personnes</div>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:20, fontWeight:700, color:PAL.ink, marginTop:2 }}>×{invited.length+1}</div>
                </div>
              </div>
            </Card>
            <FieldGroup label="Suggestions de catégories">
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {[
                  ['plane','Transport',180],['bed','Logement',140],['fork','Resto',80],['ticket','Activités',60],['receipt','Imprévu',-60+80]
                ].map(([ic, l, v]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:PAL.surface, borderRadius:99 }}>
                    <CatBadge name={ic} size={22}/>
                    <span style={{ fontSize:12, fontWeight:600, color:PAL.ink }}>{l}</span>
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:11.5, color:PAL.ink3 }}>{v}€</span>
                  </div>
                ))}
              </div>
            </FieldGroup>
            <Card style={{ background:PAL.ink, color:'#fff' }}>
              <div style={{ fontSize:11, opacity:0.65, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Récapitulatif</div>
              <div style={{ fontSize:17, fontWeight:700, marginTop:8 }}>{title || 'Mon prochain voyage'}</div>
              <div style={{ fontSize:12, opacity:0.7, marginTop:3 }}>{dates || 'Dates à définir'} · {destination || 'Destination'}</div>
              <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                <Chip tone="accent" size="sm">{invited.length+1} pers.</Chip>
                <Chip tone="accent" size="sm">{budget*(invited.length+1)}€ budget</Chip>
                <Chip tone="accent" size="sm">{vibes.find(v=>v.id===vibe).label}</Chip>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div style={{ padding:'14px 16px', paddingBottom: HOME_H + 12 }}>
        <button onClick={() => step < 2 ? setStep(step+1) : onCreate?.()} style={{
          width:'100%', height:54, borderRadius:14, border:'none',
          background:PAL.ink, color:'#fff',
          fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:15,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer',
        }}>
          {step < 2 ? <>Continuer <IcArrowR size={17} sw={2.2}/></> : <>Créer le voyage <IcSparkle size={17} sw={1.9}/></>}
        </button>
      </div>
    </div>
  );
}

const FieldGroup = ({ label, children }) => (
  <div>
    <div style={{ fontSize:11, color:PAL.ink3, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
    {children}
  </div>
);

const FieldInput = ({ value, onChange, placeholder, icon }) => (
  <div style={{
    display:'flex', alignItems:'center', gap:10, background:PAL.surface, padding:'12px 14px', borderRadius:14,
  }}>
    {icon}
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{
      flex:1, border:'none', background:'transparent', outline:'none',
      fontFamily:'Plus Jakarta Sans', fontSize:14, fontWeight:600, color:PAL.ink,
    }}/>
  </div>
);

// ─── Members screen (inside trip) ─────────────────────────────
function MembersScreen({ onBack }) {
  const trip = TRIPS[0];
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <SimpleHeader title="Équipe du voyage" onBack={onBack}/>
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 30px' }}>
        <Card style={{ background:PAL.ink, color:'#fff', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:50, height:50, borderRadius:14, background:'rgba(184,219,217,0.18)', display:'flex', alignItems:'center', justifyContent:'center', color:PAL.accent, flexShrink:0 }}>
            <IcSparkle size={22} sw={1.8}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>Inviter par lien</div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, opacity:0.65, marginTop:3 }}>travelo.co/j/LIS-9K2</div>
          </div>
          <button style={{ background:PAL.accent, color:'#1F3E3A', border:'none', padding:'8px 12px', borderRadius:10, fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:11.5, cursor:'pointer' }}>Partager</button>
        </Card>

        <SectionTitle label={`Membres · ${MEMBERS.length}`}/>
        <Card padding={0}>
          {MEMBERS.map((m, i) => {
            const isMe = m.id === 'lea';
            const isAdmin = m.id === 'lea' || m.id === 'marc';
            return (
              <React.Fragment key={m.id}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                  <Avatar id={m.id} size={40}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:PAL.ink, display:'flex', alignItems:'center', gap:6 }}>
                      {m.name}{isMe && <span style={{ fontSize:11, color:PAL.ink3, fontWeight:600 }}>· toi</span>}
                    </div>
                    <div style={{ fontSize:11.5, color:PAL.ink3, fontWeight:500, marginTop:1, textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>
                      {m.name.toLowerCase()}@email.com
                    </div>
                  </div>
                  <Chip tone={isAdmin?'accent':'ghost'} size="sm">{isAdmin?'Admin':'Membre'}</Chip>
                </div>
                {i < MEMBERS.length - 1 && <Divider inset={62}/>}
              </React.Fragment>
            );
          })}
        </Card>

        <SectionTitle label="Préférences du groupe"/>
        <Card padding={0}>
          {[
            { l:'Devise principale', v:'EUR · €' },
            { l:'Méthode de partage par défaut', v:'Égal' },
            { l:'Notifications', v:'Tous les événements' },
          ].map((r, i, arr) => (
            <React.Fragment key={r.l}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 14px' }}>
                <div style={{ fontSize:13.5, color:PAL.ink, fontWeight:600 }}>{r.l}</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, color:PAL.ink3 }}>
                  <span style={{ fontSize:12.5, fontWeight:600 }}>{r.v}</span>
                  <IcArrowR size={14} sw={2}/>
                </div>
              </div>
              {i < arr.length - 1 && <Divider/>}
            </React.Fragment>
          ))}
        </Card>

        <button style={{
          marginTop:18, width:'100%', height:48, borderRadius:14, border:`1px solid ${PAL.line2}`,
          background:'transparent', color:PAL.neg,
          fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:13.5, cursor:'pointer',
        }}>Quitter le voyage</button>
      </div>
    </div>
  );
}

const SimpleHeader = ({ title, onBack, right }) => (
  <div style={{ padding:'8px 16px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:PAL.bg }}>
    <button onClick={onBack} style={{ width:36, height:36, borderRadius:12, border:'none', background:PAL.surface, color:PAL.ink, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
      <IcArrowL size={18} sw={2}/>
    </button>
    <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>{title}</div>
    <div style={{ width:36, display:'flex', justifyContent:'flex-end' }}>{right || null}</div>
  </div>
);

// ─── Activity feed ────────────────────────────────────────────
const ACTIVITY = [
  { time:'à l\'instant', who:'sofia', kind:'expense', label:'Tour Sintra',         amount:148.00, icon:'ticket' },
  { time:'il y a 12 min', who:'tom',  kind:'comment', label:'Quelqu\'un pour Pastéis ce soir ?' },
  { time:'il y a 1 h',    who:'marc', kind:'expense', label:'Time Out · déjeuner', amount:64.50, icon:'fork' },
  { time:'il y a 2 h',    who:'lea',  kind:'settle',  label:'a réglé 86,40€',      amount:86.40 },
  { time:'hier · 18:42',  who:'sofia',kind:'plan',    label:'a réservé le Palais de la Pena' },
  { time:'hier · 14:10',  who:'tom',  kind:'joined',  label:'a rejoint le voyage' },
  { time:'lun. 11 mai',   who:'marc', kind:'expense', label:'Vol AR Paris↔Lisbonne', amount:1240.00, icon:'plane' },
  { time:'lun. 11 mai',   who:'lea',  kind:'plan',    label:'a créé le voyage' },
];

function ActivityScreen({ onOpen }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', paddingBottom: HOME_H + 78 }}>
      <div style={{ padding:'10px 22px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:PAL.ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Fil d'activité</div>
          <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:26, fontWeight:700, color:PAL.ink, marginTop:2, letterSpacing:'-0.02em' }}>Activité</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <RoundBtn><IcFilter size={18} sw={1.8}/></RoundBtn>
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        <Card padding={0}>
          {ACTIVITY.map((a, i) => (
            <React.Fragment key={i}>
              <ActivityRow a={a}/>
              {i < ACTIVITY.length - 1 && <Divider inset={64}/>}
            </React.Fragment>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ActivityRow({ a }) {
  const m = memberById(a.who);
  const verb = {
    expense:'a ajouté',
    settle:'',
    plan:'',
    comment:'a commenté',
    joined:'',
  }[a.kind];
  return (
    <div style={{ display:'flex', gap:12, padding:'13px 14px', alignItems:'flex-start' }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <Avatar id={a.who} size={36}/>
        <div style={{ position:'absolute', bottom:-2, right:-2, width:18, height:18, borderRadius:'50%',
                      background:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 0 0 2px ${PAL.surface}` }}>
          {a.kind === 'expense' && <IcReceipt size={11} sw={1.9} style={{ color:PAL.ink }}/>}
          {a.kind === 'settle'  && <IcCheck   size={11} sw={2.5} style={{ color:PAL.pos }}/>}
          {a.kind === 'plan'    && <IcMap     size={11} sw={1.9} style={{ color:PAL.ink2 }}/>}
          {a.kind === 'comment' && <IcSparkle size={11} sw={1.9} style={{ color:PAL.ink2 }}/>}
          {a.kind === 'joined'  && <IcUser    size={11} sw={1.9} style={{ color:PAL.ink2 }}/>}
        </div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color:PAL.ink, lineHeight:1.35 }}>
          <span style={{ fontWeight:700 }}>{m.name}</span>
          {' '}<span style={{ color:PAL.ink3 }}>{verb}</span>
          {a.kind !== 'comment' && a.kind !== 'expense' ? ' ' : a.kind === 'expense' ? ' ' : ' : '}
          <span style={{ fontWeight: a.kind === 'comment' ? 500 : 600 }}>
            {a.kind === 'comment' ? `« ${a.label} »` : a.label}
          </span>
        </div>
        <div style={{ fontSize:11, color:PAL.mute, fontWeight:600, marginTop:3, fontFamily:'JetBrains Mono' }}>
          {a.time} · Lisbonne en mai
        </div>
      </div>
      {a.amount && (
        <Money value={a.amount} size={13} weight={700} color={a.kind==='settle'?PAL.pos:PAL.ink}/>
      )}
    </div>
  );
}

// ─── Stats screen ─────────────────────────────────────────────
function StatsScreen() {
  const cats = [
    { id:'transport', label:'Transport', value:1270.40, color:'#B8DBD9' },
    { id:'lodging',   label:'Logement',  value:980.00,  color:'#2F4550' },
    { id:'food',      label:'Resto',     value:178.70,  color:'#586F7C' },
    { id:'activity',  label:'Activités', value:148.00,  color:'#0C1A22' },
    { id:'shopping',  label:'Autre',     value:38.30,   color:'#9CC9C5' },
  ];
  const total = cats.reduce((s,c)=>s+c.value,0);
  let cumPct = 0;

  const days = ['12','13','14','15','16','17','18'];
  const daily = [136, 92, 184, 48, 0, 0, 0];
  const maxD = Math.max(...daily);

  return (
    <div style={{ height:'100%', overflowY:'auto', paddingBottom: HOME_H + 78 }}>
      <div style={{ padding:'10px 22px 8px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:PAL.ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Insights</div>
        <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:26, fontWeight:700, color:PAL.ink, marginTop:2, letterSpacing:'-0.02em' }}>Stats</div>
      </div>

      <div style={{ padding:'8px 16px 0' }}>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6 }}>
          {['Lisbonne en mai','Tous les voyages','2026','Comparer'].map((t,i)=>(
            <Chip key={t} tone={i===0?'dark':'ghost'} size="md">{t}</Chip>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
        {/* Donut */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Répartition par catégorie</div>
            <Chip tone="ghost" size="sm">Lisbonne</Chip>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ position:'relative' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="46" fill="none" stroke={PAL.bg} strokeWidth="22"/>
                {cats.map(c => {
                  const pct = c.value / total;
                  const r = 46, C = 2 * Math.PI * r;
                  const dash = pct * C;
                  const off = -cumPct * C;
                  cumPct += pct;
                  return (
                    <circle key={c.id} cx="60" cy="60" r={r} fill="none"
                            stroke={c.color} strokeWidth="22"
                            strokeDasharray={`${dash} ${C-dash}`}
                            strokeDashoffset={off}
                            transform="rotate(-90 60 60)"/>
                  );
                })}
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:18, fontWeight:700, color:PAL.ink }}>{Math.round(total)}€</div>
                <div style={{ fontSize:9.5, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Total</div>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              {cats.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:12, fontWeight:600, color:PAL.ink2 }}>{c.label}</span>
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:11.5, color:PAL.ink3, fontWeight:600 }}>{Math.round((c.value/total)*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Daily bars */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Dépenses par jour</div>
            <div style={{ display:'flex', gap:6 }}>
              <Chip tone="dark" size="sm">Mai</Chip>
              <Chip tone="ghost" size="sm">Jours</Chip>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:130, marginTop:18 }}>
            {daily.map((v, i) => {
              const h = maxD ? (v / maxD) * 110 : 0;
              const active = i === 2;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:9.5, color:PAL.ink3, fontWeight:600 }}>{v ? v : '·'}</div>
                  <div style={{
                    width:'100%', height: Math.max(h, 4), borderRadius:8,
                    background: active ? PAL.ink : v ? PAL.accent : PAL.bg,
                    position:'relative',
                  }}>
                    {active && (
                      <div style={{ position:'absolute', left:'50%', top:-6, transform:'translateX(-50%)', width:6, height:6, borderRadius:'50%', background:PAL.accent }}/>
                    )}
                  </div>
                  <div style={{ fontSize:10.5, color: active ? PAL.ink : PAL.ink3, fontWeight: active ? 700 : 600 }}>{days[i]}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* KPI cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Card padding={14}>
            <div style={{ fontSize:10.5, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Dépense moyenne</div>
            <div style={{ marginTop:6 }}>
              <Money value={236.65} size={17} weight={700}/>
            </div>
            <div style={{ fontSize:11, color:PAL.pos, fontWeight:600, marginTop:4 }}>↘ 12% vs Porto</div>
          </Card>
          <Card padding={14}>
            <div style={{ fontSize:10.5, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Plus gros payeur</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
              <Avatar id="marc" size={26}/>
              <span style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Marc</span>
            </div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:PAL.ink3, fontWeight:600, marginTop:4 }}>1 304,50€ avancés</div>
          </Card>
        </div>

        <Card style={{ background:PAL.accent }}>
          <div style={{ display:'flex', gap:10 }}>
            <IcSparkle size={20} sw={1.9} style={{ color:'#1F3E3A', flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1F3E3A' }}>Tu es à 79% du budget</div>
              <div style={{ fontSize:12, color:'#1F3E3A', marginTop:2, lineHeight:1.4, opacity:0.85 }}>
                À ce rythme, tu finirais à 1 980€ sur 1 920€. Pense à ajuster les sorties resto.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Profile screen ───────────────────────────────────────────
function ProfileScreen({ onOnboarding }) {
  const settings = [
    {
      head: 'Compte',
      rows:[
        { ic: IcUser,   l:'Identité',          v:'Léa Marchand' },
        { ic: IcWallet, l:'Compte de virement', v:'•••• 4382' },
        { ic: IcSwap,   l:'Devise par défaut',  v:'EUR · €' },
      ],
    },
    {
      head: 'Notifications',
      rows:[
        { ic: IcBell,    l:'Nouvelles dépenses', v:'Activé' },
        { ic: IcUsers,   l:'Activité du groupe', v:'Important' },
        { ic: IcSparkle, l:'Astuces de voyage',  v:'Quotidien' },
      ],
    },
    {
      head: 'App',
      rows:[
        { ic: IcCompass, l:'Revoir l\'intro', v:'',  onClick: onOnboarding },
        { ic: IcMap,     l:'À propos',        v:'v2.4.1' },
        { ic: IcX,       l:'Se déconnecter',  v:'', danger:true },
      ],
    },
  ];
  return (
    <div style={{ height:'100%', overflowY:'auto', paddingBottom: HOME_H + 78 }}>
      {/* Header card */}
      <div style={{ padding:'10px 16px 14px' }}>
        <div style={{
          background:PAL.ink, color:'#fff', borderRadius:24, padding:'22px 22px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:-30, bottom:-30, width:160, height:160, borderRadius:'50%',
                        background:'radial-gradient(circle, rgba(184,219,217,0.32) 0%, rgba(184,219,217,0) 70%)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:62, height:62, borderRadius:18, background:PAL.accent, color:'#1F3E3A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Plus Jakarta Sans', fontSize:24, fontWeight:700 }}>LM</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.01em' }}>Léa Marchand</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginTop:2, fontWeight:500 }}>lea.marchand@email.com</div>
              <div style={{ marginTop:8, display:'flex', gap:6 }}>
                <Chip tone="accent" size="sm">PLUS</Chip>
                <Chip tone="dark" size="sm" >3 voyages</Chip>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {settings.map(s => (
          <div key={s.head} style={{ marginBottom:14 }}>
            <div style={{ padding:'10px 8px 8px', fontSize:11, color:PAL.ink3, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>{s.head}</div>
            <Card padding={0}>
              {s.rows.map((r, i) => {
                const Ic = r.ic;
                return (
                  <React.Fragment key={r.l}>
                    <div onClick={r.onClick} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 14px', cursor: r.onClick?'pointer':'default' }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:PAL.bg, color: r.danger?PAL.neg:PAL.ink2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Ic size={17} sw={1.8}/>
                      </div>
                      <div style={{ flex:1, fontSize:13.5, fontWeight:600, color: r.danger?PAL.neg:PAL.ink }}>{r.l}</div>
                      {r.v && <span style={{ fontSize:12, color:PAL.ink3, fontWeight:600 }}>{r.v}</span>}
                      <IcArrowR size={14} sw={2} style={{ color:PAL.mute }}/>
                    </div>
                    {i < s.rows.length - 1 && <Divider inset={62}/>}
                  </React.Fragment>
                );
              })}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Discussion (chat) screen ─────────────────────────────────
const MESSAGES = [
  { who:'sofia', text:'Bon, on confirme le train de 8h45 pour Sintra demain ?', time:'19:12' },
  { who:'marc',  text:'OK pour moi. J\'ai pris les billets ce matin.', time:'19:14', attach:{ type:'expense', label:'Tour Sintra · 148€'} },
  { who:'lea',   text:'Top 🙏 je gère le pique-nique', time:'19:15', me:true },
  { who:'tom',   text:'Le palais ferme à 19h normalement', time:'19:21' },
  { who:'sofia', text:'On part de l\'Airbnb à 8h alors, RDV en bas', time:'19:23' },
  { who:'lea',   text:'Ça marche. Quelqu\'un peut prendre la powerbank ?', time:'19:24', me:true },
];

function DiscussionScreen({ onBack }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:PAL.bg }}>
      <div style={{ padding:'8px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', background:PAL.surface, borderBottom:`1px solid ${PAL.line}` }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:12, border:'none', background:PAL.bg, color:PAL.ink, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <IcArrowL size={18} sw={2}/>
        </button>
        <div style={{ flex:1, marginLeft:10 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Lisbonne en mai</div>
          <div style={{ fontSize:11, color:PAL.ink3, fontWeight:500, marginTop:1 }}>4 membres · Marc tape…</div>
        </div>
        <AvatarStack ids={TRIPS[0].members} size={26}/>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ alignSelf:'center', marginBottom:6 }}>
          <Chip tone="ghost" size="sm">VENDREDI 13 MAI</Chip>
        </div>
        {MESSAGES.map((m, i) => <Bubble key={i} m={m}/>)}
      </div>

      <div style={{ padding:'10px 14px', paddingBottom: HOME_H + 8, background:PAL.surface, borderTop:`1px solid ${PAL.line}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button style={{ width:38, height:38, borderRadius:12, border:'none', background:PAL.bg, color:PAL.ink2, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <IcPlus size={18} sw={2}/>
          </button>
          <div style={{ flex:1, background:PAL.bg, borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13.5, color:PAL.ink3, fontWeight:500, flex:1 }}>Écrire un message…</span>
            <IcCamera size={16} sw={1.8} style={{ color:PAL.ink3 }}/>
          </div>
          <button style={{ width:38, height:38, borderRadius:12, border:'none', background:PAL.ink, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <IcArrowR size={18} sw={2.2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ m }) {
  const me = m.me;
  const member = memberById(m.who);
  return (
    <div style={{ display:'flex', flexDirection: me?'row-reverse':'row', alignItems:'flex-end', gap:8, maxWidth:'85%', alignSelf: me?'flex-end':'flex-start' }}>
      {!me && <Avatar id={m.who} size={28}/>}
      <div>
        {!me && <div style={{ fontSize:10.5, color:PAL.ink3, fontWeight:700, marginBottom:3, paddingLeft:4 }}>{member.name}</div>}
        <div style={{
          background: me ? PAL.ink : PAL.surface,
          color: me ? '#fff' : PAL.ink,
          padding:'10px 13px',
          borderRadius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontSize:13.5, lineHeight:1.4, fontWeight:500,
          boxShadow: me ? 'none' : '0 1px 0 rgba(47,69,80,0.04)',
        }}>{m.text}</div>
        {m.attach && (
          <div style={{
            marginTop:6, padding:'10px 12px',
            background: me ? 'rgba(255,255,255,0.06)' : PAL.accent,
            color: me ? '#fff' : '#1F3E3A',
            borderRadius:12, display:'flex', alignItems:'center', gap:10,
            border: me ? '1px solid rgba(255,255,255,0.15)' : 'none',
          }}>
            <div style={{ width:30, height:30, borderRadius:9, background: me?'rgba(184,219,217,0.16)':'#1F3E3A', color: me?PAL.accent:PAL.accent, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <IcReceipt size={15} sw={1.8}/>
            </div>
            <div style={{ flex:1, fontSize:12, fontWeight:700 }}>{m.attach.label}</div>
            <IcArrowR size={14} sw={2}/>
          </div>
        )}
        <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:PAL.mute, marginTop:4, textAlign: me?'right':'left', paddingLeft: me?0:4, paddingRight: me?4:0 }}>{m.time}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BottomNav, OnboardingScreen, NewTripWizard, MembersScreen,
  ActivityScreen, StatsScreen, ProfileScreen, DiscussionScreen,
  SimpleHeader,
});
