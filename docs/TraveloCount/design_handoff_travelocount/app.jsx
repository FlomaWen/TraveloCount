// TraveloCount — mobile app prototype
// Palette: 000000, 2F4550, 586F7C, B8DBD9, F4F4F9
const { useState, useMemo, useEffect, useRef, Fragment } = React;

// ─── Tokens ───────────────────────────────────────────────────
const PAL = {
  ink:     '#0C1A22',
  ink2:    '#2F4550',
  ink3:    '#586F7C',
  mute:    '#8FA0AB',
  line:    'rgba(47, 69, 80, 0.10)',
  line2:   'rgba(47, 69, 80, 0.16)',
  bg:      '#F4F4F9',
  surface: '#FFFFFF',
  accent:  '#B8DBD9',
  accent2: '#9CC9C5',
  pos:     '#2F7A6A',
  neg:     '#A0496B',
};

// ─── Mock data ────────────────────────────────────────────────
const ME = { id: 'lea', name: 'Léa', initials: 'LM', tone: '#B8DBD9' };
const MEMBERS = [
  ME,
  { id: 'marc',  name: 'Marc',  initials: 'MR', tone: '#2F4550' },
  { id: 'sofia', name: 'Sofia', initials: 'SA', tone: '#586F7C' },
  { id: 'tom',   name: 'Tom',   initials: 'TG', tone: '#0C1A22' },
];
const memberById = (id) => MEMBERS.find(m => m.id === id);

const TRIPS = [
  {
    id: 'lisbonne', title: 'Lisbonne en mai', dates: '12 → 19 mai 2026',
    status: 'active', dayN: 3, dayTotal: 7,
    members: ['lea','marc','sofia','tom'],
    budget: 480 * 4, spent: 1893.20, currency: '€',
    cover: 'linear-gradient(135deg, #2F4550 0%, #586F7C 60%, #B8DBD9 100%)',
    coverLabel: 'Lisbonne · Tage',
    balance: -267.80,  // négatif = vous devez
  },
  {
    id: 'chamonix', title: 'Chamonix · ski', dates: '8 → 12 fév 2027',
    status: 'upcoming', members: ['lea','marc','tom'],
    budget: 1200, spent: 320, currency: '€',
    cover: 'linear-gradient(160deg, #0C1A22 0%, #2F4550 55%, #586F7C 100%)',
    coverLabel: 'Mont-Blanc',
    balance: 0,
  },
  {
    id: 'porto', title: 'Week-end Porto', dates: '14 → 17 mars 2026',
    status: 'past', members: ['lea','sofia'],
    budget: 420, spent: 412.50, currency: '€',
    cover: 'linear-gradient(135deg, #586F7C 0%, #B8DBD9 100%)',
    coverLabel: 'Porto · Douro',
    balance: 42.10,  // positif = on vous doit
  },
];
const tripById = (id) => TRIPS.find(t => t.id === id);

const EXPENSES = [
  { id:'e1', tripId:'lisbonne', label:'Vol aller-retour CDG → LIS', cat:'transport', icon:'plane',
    amount:1240.00, paidBy:'marc', date:'2026-04-22', split:'equal', dayLabel:'Avant le départ' },
  { id:'e2', tripId:'lisbonne', label:'Airbnb · Alfama (7 nuits)', cat:'lodging', icon:'bed',
    amount:980.00, paidBy:'sofia', date:'2026-04-30', split:'equal', dayLabel:'Avant le départ' },
  { id:'e3', tripId:'lisbonne', label:'Bolt aéroport → Airbnb', cat:'transport', icon:'car',
    amount:18.40, paidBy:'tom', date:'2026-05-12', split:'equal', dayLabel:'Jour 1 · jeu 12 mai' },
  { id:'e4', tripId:'lisbonne', label:'Dîner Bairro Alto', cat:'food', icon:'fork',
    amount:96.20, paidBy:'lea', date:'2026-05-12', split:'equal', dayLabel:'Jour 1 · jeu 12 mai' },
  { id:'e5', tripId:'lisbonne', label:'Tram 28 + Miradouros', cat:'transport', icon:'car',
    amount:12.00, paidBy:'lea', date:'2026-05-13', split:'equal', dayLabel:'Jour 2 · ven 13 mai' },
  { id:'e6', tripId:'lisbonne', label:'Time Out Market · déjeuner', cat:'food', icon:'fork',
    amount:64.50, paidBy:'marc', date:'2026-05-13', split:'equal', dayLabel:'Jour 2 · ven 13 mai' },
  { id:'e7', tripId:'lisbonne', label:'Tour Sintra (Pena + Quinta)', cat:'activity', icon:'ticket',
    amount:148.00, paidBy:'sofia', date:'2026-05-14', split:'equal', dayLabel:'Jour 3 · sam 14 mai' },
  { id:'e8', tripId:'lisbonne', label:'Pastéis de Belém', cat:'food', icon:'fork',
    amount:18.30, paidBy:'tom', date:'2026-05-14', split:'equal', dayLabel:'Jour 3 · sam 14 mai' },
];

const ITINERARY = [
  { tripId:'lisbonne', day:1, weekday:'jeu', date:'12 mai', items:[
    { time:'14:20', icon:'plane', title:'Vol TP 433 · CDG → LIS', meta:'TAP · siège 18A · réservé' },
    { time:'17:00', icon:'bed',   title:'Check-in Airbnb · Alfama', meta:'Rua dos Remédios 84' },
    { time:'20:30', icon:'fork',  title:'Dîner · Bairro Alto', meta:'Sans réservation' },
  ]},
  { tripId:'lisbonne', day:2, weekday:'ven', date:'13 mai', items:[
    { time:'10:00', icon:'pin',   title:'Alfama walking tour', meta:'Départ Largo das Portas do Sol' },
    { time:'13:00', icon:'fork',  title:'Time Out Market', meta:'Déjeuner libre' },
    { time:'16:30', icon:'pin',   title:'Tram 28 + miradouros', meta:'Carte journalière 6,80€' },
  ]},
  { tripId:'lisbonne', day:3, weekday:'sam', date:'14 mai', highlight:true, items:[
    { time:'08:45', icon:'car',   title:'Train pour Sintra', meta:'Rossio · billets achetés' },
    { time:'10:30', icon:'ticket',title:'Palais de la Pena', meta:'Entrée 14€ · billets coupe-file' },
    { time:'14:00', icon:'ticket',title:'Quinta da Regaleira', meta:'Entrée 11€' },
    { time:'19:00', icon:'fork',  title:'Dîner Cabo da Roca', meta:'Sunset · pas de résa' },
  ]},
  { tripId:'lisbonne', day:4, weekday:'dim', date:'15 mai', items:[
    { time:'10:00', icon:'pin',   title:'Belém · MAAT + Monastère', meta:'À pied depuis le tram 15' },
    { time:'13:00', icon:'fork',  title:'Pastéis de Belém', meta:'Faire la queue à droite' },
    { time:'17:00', icon:'pin',   title:'LX Factory', meta:'Shopping + apéro' },
  ]},
];

// Balances computed visuel-only (mock)
const BALANCES = [
  { from:'lea',  to:'marc',  amount:208.40 },
  { from:'lea',  to:'sofia', amount: 59.40 },
  { from:'tom',  to:'sofia', amount:142.10 },
  { from:'tom',  to:'marc',  amount: 36.80 },
];

// ─── Atoms ────────────────────────────────────────────────────
const Avatar = ({ id, size = 30, ring }) => {
  const m = memberById(id) || { initials:'??', tone:'#586F7C' };
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:m.tone, color: m.tone==='#B8DBD9' ? PAL.ink : '#fff',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'Plus Jakarta Sans', fontWeight:600, fontSize:size*0.36,
      letterSpacing:'0.02em',
      boxShadow: ring ? `0 0 0 2px ${PAL.surface}` : 'none',
      flexShrink:0,
    }}>{m.initials}</div>
  );
};

const AvatarStack = ({ ids, size = 26, max = 5 }) => (
  <div style={{ display:'flex' }}>
    {ids.slice(0, max).map((id, i) => (
      <div key={id} style={{ marginLeft: i===0 ? 0 : -8 }}>
        <Avatar id={id} size={size} ring />
      </div>
    ))}
    {ids.length > max && (
      <div style={{
        width:size, height:size, marginLeft:-8, borderRadius:'50%',
        background:PAL.bg, color:PAL.ink3, boxShadow:`0 0 0 2px ${PAL.surface}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:size*0.36, fontWeight:600, fontFamily:'Plus Jakarta Sans',
      }}>+{ids.length - max}</div>
    )}
  </div>
);

const Money = ({ value, sign, size = 16, weight = 600, color, currency='€', dim }) => {
  const v = Math.abs(value);
  const display = v.toLocaleString('fr-FR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  return (
    <span style={{ fontFamily:'JetBrains Mono, ui-monospace', fontWeight:weight,
                   fontSize:size, color:color || PAL.ink, letterSpacing:'-0.01em',
                   fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
      {sign && (sign === 'pos' ? '+' : sign === 'neg' ? '−' : '')}{display}
      <span style={{ marginLeft:2, fontSize:size*0.78, color: dim || color || PAL.ink3, fontWeight:500 }}>{currency}</span>
    </span>
  );
};

const Chip = ({ children, tone = 'default', size='md' }) => {
  const tones = {
    default:  { bg:'rgba(47,69,80,0.07)', fg:PAL.ink2 },
    accent:   { bg:PAL.accent, fg:'#1F3E3A' },
    dark:     { bg:PAL.ink, fg:'#fff' },
    pos:      { bg:'rgba(47,122,106,0.12)', fg:PAL.pos },
    neg:      { bg:'rgba(160,73,107,0.12)', fg:PAL.neg },
    ghost:    { bg:'transparent', fg:PAL.ink3, border:`1px solid ${PAL.line2}` },
  };
  const t = tones[tone] || tones.default;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:t.bg, color:t.fg, border:t.border || 'none',
      fontSize: size==='sm' ? 11 : 12, fontWeight:600, letterSpacing:'0.01em',
      padding: size==='sm' ? '3px 8px' : '5px 10px', borderRadius:999, whiteSpace:'nowrap',
    }}>{children}</span>
  );
};

const Card = ({ children, style, onClick, padding=16 }) => (
  <div onClick={onClick} style={{
    background:PAL.surface, borderRadius:20, padding,
    boxShadow:'0 1px 0 rgba(47,69,80,0.04), 0 1px 2px rgba(47,69,80,0.04)',
    cursor:onClick?'pointer':'default',
    ...style,
  }}>{children}</div>
);

const Divider = ({ inset = 0 }) => (
  <div style={{ height:1, background:PAL.line, marginLeft:inset }} />
);

const CatIcon = ({ name, size = 18, color }) => {
  const map = { plane:IcPlane, bed:IcBed, fork:IcFork, car:IcCar, ticket:IcTicket, pin:IcPin };
  const C = map[name] || IcReceipt;
  return <C size={size} sw={1.8} style={{ color: color || PAL.ink2 }} />;
};

const CatBadge = ({ name, size = 38 }) => {
  const tones = {
    transport:'#B8DBD9', lodging:'#2F4550', food:'#586F7C',
    activity:'#0C1A22', shopping:'#9CC9C5',
  };
  const iconColorWhite = { lodging:true, food:true, activity:true };
  const map = { plane:'transport', bed:'lodging', fork:'food', car:'transport', ticket:'activity', pin:'activity' };
  const cat = map[name] || 'transport';
  const bg = tones[cat];
  const fg = iconColorWhite[cat] ? '#fff' : PAL.ink;
  return (
    <div style={{
      width:size, height:size, borderRadius:12, background:bg,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    }}>
      <CatIcon name={name} size={size*0.5} color={fg} />
    </div>
  );
};

// ─── App shell ────────────────────────────────────────────────
const STATUSBAR_H = 62; // top status bar in IOSDevice
const HOME_H = 34;

function App() {
  // screen: 'trips' | 'trip' | 'activity' | 'stats' | 'profile' | 'newtrip' | 'onboarding' | 'members' | 'discussion'
  const [route, setRoute] = useState({ screen: 'trips', tripId: null, tab: 'overview' });
  const [sheet, setSheet] = useState(null);    // null | 'add' | 'settle' | 'detail'
  const [activeExpense, setActiveExpense] = useState(null);
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "#B8DBD9",
    "darkTrip": true,
    "showCover": true,
    "density": "comfortable",
    "startScreen": "trips"
  }/*EDITMODE-END*/);

  // Apply startScreen tweak when changed
  useEffect(() => {
    setRoute(r => {
      const s = tweaks.startScreen;
      if (!s || s === r.screen) return r;
      if (s === 'trip') return { screen:'trip', tripId:'lisbonne', tab:'overview' };
      return { ...r, screen: s };
    });
  }, [tweaks.startScreen]);

  const goTrip = (id) => setRoute({ screen:'trip', tripId:id, tab:'overview' });
  const goTrips = () => setRoute({ screen:'trips' });
  const setTab = (tab) => setRoute(r => ({ ...r, tab }));
  const navTab = (id) => {
    if (id === 'trips') setRoute({ screen:'trips' });
    else setRoute({ screen:id });
  };

  const openAdd = () => setSheet('add');
  const openSettle = () => setSheet('settle');
  const closeSheet = () => setSheet(null);

  const SHELL_TABS = ['trips','activity','stats','profile'];
  const showNav = SHELL_TABS.includes(route.screen);

  let screen;
  if (route.screen === 'trips') {
    screen = <TripsScreen onOpen={goTrip} />;
  } else if (route.screen === 'activity') {
    screen = <ActivityScreen />;
  } else if (route.screen === 'stats') {
    screen = <StatsScreen />;
  } else if (route.screen === 'profile') {
    screen = <ProfileScreen onOnboarding={() => setRoute({ screen:'onboarding' })} />;
  } else if (route.screen === 'newtrip') {
    screen = <NewTripWizard onClose={goTrips} onCreate={goTrips} />;
  } else if (route.screen === 'onboarding') {
    screen = <OnboardingScreen onDone={goTrips} />;
  } else if (route.screen === 'members') {
    screen = <MembersScreen onBack={() => setRoute({ screen:'trip', tripId:'lisbonne', tab:'overview' })} />;
  } else if (route.screen === 'discussion') {
    screen = <DiscussionScreen onBack={() => setRoute({ screen:'trip', tripId:'lisbonne', tab:'overview' })} />;
  } else {
    screen = <TripScreen route={route} setTab={setTab} onBack={goTrips} onAdd={openAdd} onSettle={openSettle}
                  onExpense={(e)=>{ setActiveExpense(e); setSheet('detail'); }}
                  onMembers={() => setRoute({ screen:'members' })}
                  onDiscussion={() => setRoute({ screen:'discussion' })}
                  tweaks={tweaks} />;
  }

  return (
    <div style={{
      minHeight:'100vh', width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      background:'radial-gradient(1200px 600px at 30% 0%, #DDE5E9 0%, #C9D3D7 45%, #B7C3C8 100%)',
      padding:'40px 20px', fontFamily:'Plus Jakarta Sans, system-ui, sans-serif',
      color:PAL.ink, boxSizing:'border-box',
    }}>
      <IOSDevice width={402} height={874}>
        <div style={{
          paddingTop: STATUSBAR_H, height:'100%', boxSizing:'border-box',
          background:PAL.bg, position:'relative', overflow:'hidden',
          fontFamily:'Plus Jakarta Sans, system-ui',
        }}>
          {screen}
          {showNav && <BottomNav current={route.screen} onChange={navTab} onNew={() => setRoute({ screen:'newtrip' })} />}
          {sheet === 'add'    && <AddExpenseSheet onClose={closeSheet} tripId={route.tripId || 'lisbonne'} />}
          {sheet === 'settle' && <SettleSheet onClose={closeSheet} />}
          {sheet === 'detail' && activeExpense && <ExpenseDetailSheet e={activeExpense} onClose={closeSheet} />}
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks" defaultPosition={{ right: 24, bottom: 24 }}>
        <TweakSection title="Écran de démo">
          <TweakSelect value={tweaks.startScreen} onChange={v=>setTweak('startScreen', v)}
            options={[
              { value:'trips',       label:'Mes voyages' },
              { value:'trip',        label:'Détail voyage' },
              { value:'activity',    label:'Activité' },
              { value:'stats',       label:'Stats' },
              { value:'profile',     label:'Profil' },
              { value:'newtrip',     label:'Nouveau voyage' },
              { value:'members',     label:'Membres' },
              { value:'discussion',  label:'Discussion' },
              { value:'onboarding',  label:'Onboarding' },
            ]}/>
        </TweakSection>
        <TweakSection title="Voyage actuel">
          <TweakToggle label="Couverture photo" value={tweaks.showCover} onChange={v=>setTweak('showCover', v)} />
          <TweakToggle label="Header sombre"    value={tweaks.darkTrip}  onChange={v=>setTweak('darkTrip', v)} />
        </TweakSection>
        <TweakSection title="Densité">
          <TweakRadio value={tweaks.density} onChange={v=>setTweak('density', v)}
            options={[{ value:'comfortable', label:'Confort' }, { value:'compact', label:'Compact' }]} />
        </TweakSection>
        <TweakSection title="Accent">
          <TweakColor value={tweaks.accent} onChange={v=>setTweak('accent', v)}
            options={['#B8DBD9','#2F4550','#586F7C','#0C1A22']} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ─── Screen: Trips list ───────────────────────────────────────
function TripsScreen({ onOpen }) {
  const active = TRIPS.filter(t => t.status === 'active');
  const upcoming = TRIPS.filter(t => t.status === 'upcoming');
  const past = TRIPS.filter(t => t.status === 'past');
  const totalDue = TRIPS.reduce((s, t) => s + t.balance, 0);

  return (
    <div style={{ height:'100%', overflowY:'auto', paddingBottom: HOME_H + 78 }}>
      {/* App header */}
      <div style={{ padding:'10px 22px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:PAL.ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Bonjour Léa</div>
          <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:26, fontWeight:700, color:PAL.ink, marginTop:2, letterSpacing:'-0.02em' }}>
            TraveloCount
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <RoundBtn><IcSearch size={18} sw={1.8} /></RoundBtn>
          <RoundBtn dot><IcBell size={18} sw={1.8} /></RoundBtn>
        </div>
      </div>

      {/* Total balance card */}
      <div style={{ padding:'14px 16px 8px' }}>
        <div style={{
          background:PAL.ink, color:'#fff', borderRadius:24, padding:'18px 20px 18px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:-40, top:-40, width:180, height:180, borderRadius:'50%',
                        background:'radial-gradient(circle, rgba(184,219,217,0.35) 0%, rgba(184,219,217,0) 70%)' }} />
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Solde global · tous voyages
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:6 }}>
            <Money value={totalDue} size={32} weight={700} color="#fff" dim="rgba(255,255,255,0.55)"
                   sign={totalDue<0?'neg':'pos'} />
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>{totalDue < 0 ? 'à payer' : 'à recevoir'}</span>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button style={{
              flex:1, height:38, borderRadius:12, border:'none',
              background:PAL.accent, color:PAL.ink, fontFamily:'Plus Jakarta Sans',
              fontWeight:700, fontSize:13, letterSpacing:'0.01em', display:'flex',
              alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <IcSwap size={15} sw={2}/> Régler les comptes
            </button>
            <button style={{
              flex:1, height:38, borderRadius:12, border:'1px solid rgba(255,255,255,0.18)',
              background:'transparent', color:'#fff', fontFamily:'Plus Jakarta Sans',
              fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <IcChart size={15} sw={1.8}/> Voir le détail
            </button>
          </div>
        </div>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <SectionTitle label="En cours" right={<span style={{ fontSize:11, color:PAL.ink3, fontWeight:600 }}>1 voyage</span>} />
      )}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:12 }}>
        {active.map(t => <TripCardLarge key={t.id} trip={t} onClick={() => onOpen(t.id)} />)}
      </div>

      {/* Upcoming */}
      <SectionTitle label="À venir" right={
        <button style={{ background:'none', border:'none', color:PAL.ink, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
          Nouveau voyage <IcPlus size={14} sw={2.2}/>
        </button>}/>
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {upcoming.map(t => <TripCardSmall key={t.id} trip={t} onClick={() => onOpen(t.id)} />)}
      </div>

      {/* Past */}
      <SectionTitle label="Passés" />
      <div style={{ padding:'0 16px 24px', display:'flex', flexDirection:'column', gap:10 }}>
        {past.map(t => <TripCardSmall key={t.id} trip={t} onClick={() => onOpen(t.id)} muted />)}
      </div>
    </div>
  );
}

const SectionTitle = ({ label, right }) => (
  <div style={{ padding:'22px 22px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
    <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:14, fontWeight:700, color:PAL.ink, letterSpacing:'-0.01em' }}>
      {label}
    </div>
    {right}
  </div>
);

const RoundBtn = ({ children, dot, onClick }) => (
  <button onClick={onClick} style={{
    width:38, height:38, borderRadius:12, border:`1px solid ${PAL.line2}`,
    background:PAL.surface, color:PAL.ink, display:'flex', alignItems:'center', justifyContent:'center',
    position:'relative', cursor:'pointer',
  }}>
    {children}
    {dot && <span style={{ position:'absolute', top:9, right:10, width:7, height:7, borderRadius:'50%', background:PAL.neg, boxShadow:`0 0 0 2px ${PAL.surface}` }}/>}
  </button>
);

function TripCardLarge({ trip, onClick }) {
  const pct = Math.min(1, trip.spent / trip.budget);
  return (
    <div onClick={onClick} style={{
      background:PAL.surface, borderRadius:24, overflow:'hidden',
      boxShadow:'0 1px 0 rgba(47,69,80,0.04), 0 8px 20px rgba(47,69,80,0.06)',
      cursor:'pointer',
    }}>
      {/* Cover */}
      <div style={{ height:128, background:trip.cover, position:'relative', overflow:'hidden' }}>
        {/* texture */}
        <svg style={{ position:'absolute', inset:0, opacity:0.18 }} width="100%" height="100%">
          <defs>
            <pattern id="dotgrid" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)"/>
        </svg>
        {/* mountain/skyline silhouette */}
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ position:'absolute', bottom:0, left:0, width:'100%', height:60, opacity:0.32 }}>
          <path d="M0,60 L0,40 L40,28 L60,38 L100,18 L140,32 L180,22 L220,30 L260,14 L300,28 L340,20 L380,32 L400,28 L400,60 Z" fill="#0C1A22"/>
        </svg>
        <div style={{ position:'absolute', top:12, left:14, display:'flex', gap:6 }}>
          <Chip tone="dark" size="sm">● EN COURS · J{trip.dayN}/{trip.dayTotal}</Chip>
        </div>
        <div style={{ position:'absolute', top:12, right:14 }}>
          <AvatarStack ids={trip.members} size={26} />
        </div>
        <div style={{ position:'absolute', bottom:14, left:16, color:'#fff' }}>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:10, opacity:0.7, letterSpacing:'0.16em' }}>{trip.coverLabel.toUpperCase()}</div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:'14px 18px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:PAL.ink, letterSpacing:'-0.01em' }}>{trip.title}</div>
            <div style={{ fontSize:12, color:PAL.ink3, marginTop:2, fontWeight:500 }}>{trip.dates}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              {trip.balance < 0 ? 'Tu dois' : 'On te doit'}
            </div>
            <Money value={trip.balance} size={16} weight={700}
                   color={trip.balance < 0 ? PAL.neg : PAL.pos}
                   sign={trip.balance < 0 ? 'neg' : 'pos'} />
          </div>
        </div>
        {/* progress */}
        <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', fontSize:11, color:PAL.ink3, fontWeight:600 }}>
          <span>Dépensé · <Money value={trip.spent} size={11} weight={600} color={PAL.ink2}/></span>
          <span>Budget · <Money value={trip.budget} size={11} weight={600} color={PAL.ink2}/></span>
        </div>
        <div style={{ marginTop:6, height:6, background:PAL.bg, borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct*100}%`, background:`linear-gradient(90deg, ${PAL.ink2}, ${PAL.accent})`, borderRadius:99 }}/>
        </div>
      </div>
    </div>
  );
}

function TripCardSmall({ trip, onClick, muted }) {
  return (
    <div onClick={onClick} style={{
      background:PAL.surface, borderRadius:18, padding:'12px 14px',
      display:'flex', alignItems:'center', gap:14, cursor:'pointer',
      opacity: muted ? 0.78 : 1,
      boxShadow:'0 1px 0 rgba(47,69,80,0.03)',
    }}>
      <div style={{ width:46, height:46, borderRadius:14, background:trip.cover, flexShrink:0, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.08)' }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:PAL.ink, letterSpacing:'-0.01em' }}>{trip.title}</div>
        <div style={{ fontSize:11.5, color:PAL.ink3, fontWeight:500, marginTop:2 }}>{trip.dates} · {trip.members.length} pers.</div>
      </div>
      {trip.balance !== 0 ? (
        <div style={{ textAlign:'right' }}>
          <Money value={trip.balance} size={13} weight={700}
                 color={trip.balance < 0 ? PAL.neg : PAL.pos}
                 sign={trip.balance < 0 ? 'neg' : 'pos'} />
          <div style={{ fontSize:10, color:PAL.ink3, fontWeight:600, marginTop:1 }}>{trip.balance < 0 ? 'à payer' : 'à recevoir'}</div>
        </div>
      ) : (
        <Chip tone="ghost" size="sm">Équilibré</Chip>
      )}
    </div>
  );
}

// Other JSX files extend window — pull them
Object.assign(window, { App, TripsScreen, SectionTitle, RoundBtn, TripCardLarge, TripCardSmall,
                        Avatar, AvatarStack, Money, Chip, Card, Divider, CatIcon, CatBadge, PAL, ME, MEMBERS,
                        TRIPS, EXPENSES, ITINERARY, BALANCES, tripById, memberById, STATUSBAR_H, HOME_H });
