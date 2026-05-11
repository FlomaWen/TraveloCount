// Trip detail + tabs + add expense sheet + settle sheet
const { useState: useStateT } = React;

// ─── Screen: Trip detail ──────────────────────────────────────
function TripScreen({ route, setTab, onBack, onAdd, onSettle, onExpense, onMembers, onDiscussion, tweaks }) {
  const trip = tripById(route.tripId) || TRIPS[0];
  const dark = tweaks.darkTrip;
  const showCover = tweaks.showCover;

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Trip header */}
      <TripHeader trip={trip} dark={dark} showCover={showCover} onBack={onBack} onMembers={onMembers} onDiscussion={onDiscussion} />

      {/* Tabs */}
      <TripTabs current={route.tab} onChange={setTab} />

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', position:'relative' }}>
        {route.tab === 'overview'  && <OverviewTab  trip={trip} onAdd={onAdd} onSettle={onSettle} onExpense={onExpense} onTab={setTab} />}
        {route.tab === 'expenses'  && <ExpensesTab  trip={trip} onAdd={onAdd} onExpense={onExpense} />}
        {route.tab === 'itinerary' && <ItineraryTab trip={trip} />}
        {route.tab === 'balance'   && <BalanceTab   trip={trip} onSettle={onSettle} />}
      </div>

      {/* FAB (only on Expenses) */}
      {route.tab === 'expenses' && (
        <button onClick={onAdd} style={{
          position:'absolute', right:18, bottom: HOME_H + 16,
          width:58, height:58, borderRadius:'50%', border:'none',
          background:PAL.ink, color:'#fff', cursor:'pointer',
          boxShadow:'0 10px 24px rgba(12,26,34,0.30), 0 2px 4px rgba(12,26,34,0.16)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <IcPlus size={26} sw={2.2}/>
        </button>
      )}
    </div>
  );
}

function TripHeader({ trip, dark, showCover, onBack, onMembers, onDiscussion }) {
  const bg = dark ? trip.cover : '#fff';
  const fg = dark ? '#fff' : PAL.ink;
  const sub = dark ? 'rgba(255,255,255,0.7)' : PAL.ink3;
  return (
    <div style={{
      background: bg, color: fg, padding:'8px 16px 18px',
      position:'relative', overflow:'hidden',
      boxShadow: dark ? 'none' : `inset 0 -1px 0 ${PAL.line}`,
    }}>
      {dark && showCover && (
        <>
          <svg style={{ position:'absolute', inset:0, opacity:0.14 }} width="100%" height="100%">
            <defs>
              <pattern id="dotgrid2" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid2)"/>
          </svg>
          <svg viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position:'absolute', bottom:0, left:0, width:'100%', height:80, opacity:0.22 }}>
            <path d="M0,80 L0,52 L30,38 L70,48 L110,30 L150,42 L200,28 L240,40 L280,22 L320,36 L360,28 L400,38 L400,80 Z" fill="#0C1A22"/>
          </svg>
        </>
      )}

      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onBack} style={{
          width:36, height:36, borderRadius:12, border:'none',
          background: dark ? 'rgba(255,255,255,0.14)' : PAL.bg,
          color:fg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <IcArrowL size={18} sw={2}/>
        </button>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onDiscussion} style={{
            width:36, height:36, borderRadius:12, border:'none',
            background: dark ? 'rgba(255,255,255,0.14)' : PAL.bg,
            color:fg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            position:'relative',
          }}>
            <IcSparkle size={18} sw={1.8}/>
            <span style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:PAL.accent, boxShadow: dark?'0 0 0 2px rgba(47,69,80,0.6)':`0 0 0 2px ${PAL.bg}` }}/>
          </button>
          <button onClick={onMembers} style={{
            width:36, height:36, borderRadius:12, border:'none',
            background: dark ? 'rgba(255,255,255,0.14)' : PAL.bg,
            color:fg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}>
            <IcUsers size={18} sw={1.8}/>
          </button>
        </div>
      </div>

      <div style={{ position:'relative', marginTop:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Chip tone={dark?'dark':'accent'} size="sm">● EN COURS · JOUR {trip.dayN}/{trip.dayTotal}</Chip>
        </div>
        <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:30, fontWeight:700, marginTop:10, letterSpacing:'-0.025em', lineHeight:1.05 }}>
          {trip.title}
        </div>
        <div style={{ fontSize:13, color:sub, marginTop:4, fontWeight:500 }}>
          {trip.dates} · 4 personnes
        </div>

        {/* Stats inline */}
        <div style={{ display:'flex', gap:18, marginTop:16, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, color:sub, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Dépensé</div>
            <Money value={trip.spent} size={18} weight={700} color={fg} dim={sub} />
          </div>
          <div style={{ width:1, height:28, background: dark ? 'rgba(255,255,255,0.18)' : PAL.line }}/>
          <div>
            <div style={{ fontSize:10, color:sub, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Budget</div>
            <Money value={trip.budget} size={18} weight={700} color={fg} dim={sub} />
          </div>
          <div style={{ marginLeft:'auto' }}>
            <AvatarStack ids={trip.members} size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TripTabs({ current, onChange }) {
  const tabs = [
    { id:'overview',  label:'Vue',        icon:IcCompass },
    { id:'expenses',  label:'Dépenses',   icon:IcReceipt },
    { id:'itinerary', label:'Itinéraire', icon:IcMap     },
    { id:'balance',   label:'Comptes',    icon:IcWallet  },
  ];
  return (
    <div style={{
      display:'flex', padding:'6px 6px', gap:4, background:PAL.surface,
      borderTop:`1px solid ${PAL.line}`, borderBottom:`1px solid ${PAL.line}`,
    }}>
      {tabs.map(t => {
        const active = current === t.id;
        const Ic = t.icon;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex:1, height:40, borderRadius:12, border:'none',
            background: active ? PAL.ink : 'transparent',
            color: active ? '#fff' : PAL.ink3,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            fontFamily:'Plus Jakarta Sans', fontWeight:active?700:600, fontSize:12.5,
            cursor:'pointer', transition:'background 0.15s',
          }}>
            <Ic size={15} sw={1.9}/>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────
function OverviewTab({ trip, onAdd, onSettle, onExpense, onTab }) {
  const recent = EXPENSES.filter(e => e.tripId === trip.id).slice(-3).reverse();
  const today = ITINERARY.find(d => d.tripId === trip.id && d.day === trip.dayN);
  const pct = trip.spent / trip.budget;
  return (
    <div style={{ padding:'14px 16px 30px', display:'flex', flexDirection:'column', gap:12 }}>
      {/* Today / next event */}
      {today && (
        <Card padding={0}>
          <div style={{
            padding:'12px 16px 8px', borderBottom:`1px solid ${PAL.line}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:PAL.pos }}/>
              <span style={{ fontSize:11, fontWeight:700, color:PAL.ink, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Aujourd'hui · Jour {trip.dayN}
              </span>
            </div>
            <button onClick={()=>onTab('itinerary')} style={{ background:'none', border:'none', color:PAL.ink3, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:2, cursor:'pointer' }}>
              Voir le jour <IcArrowR size={13} sw={2}/>
            </button>
          </div>
          <div style={{ padding:'10px 4px 12px' }}>
            {today.items.slice(0,3).map((it, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 14px' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11.5, color:PAL.ink3, fontWeight:600, width:42 }}>{it.time}</div>
                <CatBadge name={it.icon} size={30}/>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:PAL.ink, lineHeight:1.25 }}>{it.title}</div>
                  <div style={{ fontSize:11.5, color:PAL.ink3, fontWeight:500, marginTop:1, textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{it.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Budget compact card */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:11, color:PAL.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Budget · {Math.round(pct*100)}% utilisé</div>
            <div style={{ marginTop:6 }}>
              <Money value={trip.spent} size={20} weight={700} color={PAL.ink}/>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:13, color:PAL.ink3, fontWeight:500, marginLeft:6 }}>
                / {trip.budget.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <Chip tone="pos" size="sm">↘ Dans le budget</Chip>
        </div>
        <div style={{ marginTop:12, height:8, background:PAL.bg, borderRadius:99, overflow:'hidden', position:'relative' }}>
          <div style={{ height:'100%', width:`${pct*100}%`, background:`linear-gradient(90deg, ${PAL.ink2}, ${PAL.accent})`, borderRadius:99 }}/>
          <div style={{ position:'absolute', left:`${(trip.dayN/trip.dayTotal)*100}%`, top:-3, bottom:-3, width:2, background:PAL.ink }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:PAL.ink3, fontWeight:600, marginTop:6, letterSpacing:'0.02em' }}>
          <span>Aujourd'hui · J{trip.dayN}</span>
          <span>Fin · J{trip.dayTotal}</span>
        </div>
      </Card>

      {/* Balance summary card */}
      <Card padding={0}>
        <div style={{ padding:'14px 16px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Ta position</div>
          <button onClick={onSettle} style={{ background:PAL.ink, color:'#fff', fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:11.5, padding:'7px 10px', borderRadius:9, border:'none', display:'flex', alignItems:'center', gap:4 }}>
            <IcSwap size={13} sw={2}/> Régler
          </button>
        </div>
        <div style={{ padding:'0 16px 14px' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <Money value={trip.balance} size={26} weight={700} color={PAL.neg} sign="neg"/>
            <span style={{ fontSize:12, color:PAL.ink3, fontWeight:600 }}>à reverser au groupe</span>
          </div>
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
            {BALANCES.filter(b => b.from === 'lea').map((b, i) => {
              const to = memberById(b.to);
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:PAL.bg, borderRadius:12 }}>
                  <Avatar id="lea" size={26}/>
                  <IcArrowR size={14} sw={2} style={{ color: PAL.ink3 }}/>
                  <Avatar id={b.to} size={26}/>
                  <div style={{ flex:1, fontSize:12.5, color:PAL.ink2, fontWeight:600 }}>Tu dois à {to.name}</div>
                  <Money value={b.amount} size={13} weight={700} color={PAL.neg}/>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent expenses */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 4px 0' }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Dernières dépenses</div>
        <button onClick={()=>onTab('expenses')} style={{ background:'none', border:'none', color:PAL.ink3, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:2, cursor:'pointer' }}>
          Tout voir <IcArrowR size={13} sw={2}/>
        </button>
      </div>
      <Card padding={0}>
        {recent.map((e, i) => (
          <Fragment key={e.id}>
            <ExpenseRow e={e} onClick={()=>onExpense(e)}/>
            {i < recent.length - 1 && <Divider inset={62} />}
          </Fragment>
        ))}
      </Card>

      {/* Suggestion */}
      <Card style={{ background:PAL.accent, border:'none', display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'#1F3E3A', color:PAL.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <IcSparkle size={18} sw={1.8}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1F3E3A' }}>Astuce du jour</div>
          <div style={{ fontSize:12.5, color:'#1F3E3A', marginTop:2, lineHeight:1.4 }}>
            Le tram 28 est pris d'assaut après 10h. Pars du Martim Moniz avant 9h pour la place côté droit.
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Expenses ────────────────────────────────────────────
function ExpensesTab({ trip, onAdd, onExpense }) {
  const list = EXPENSES.filter(e => e.tripId === trip.id);
  const grouped = list.reduce((acc, e) => {
    (acc[e.dayLabel] = acc[e.dayLabel] || []).push(e); return acc;
  }, {});

  return (
    <div style={{ padding:'14px 16px 100px' }}>
      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:14, overflowX:'auto' }}>
        {['Tout', 'Transport', 'Logement', 'Resto', 'Activités'].map((f, i) => (
          <Chip key={f} tone={i===0?'dark':'default'} size="md">{f}</Chip>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:999, border:`1px solid ${PAL.line2}`, fontSize:12, fontWeight:600, color:PAL.ink2 }}>
          <IcFilter size={13} sw={2}/> Trier
        </div>
      </div>

      {Object.entries(grouped).reverse().map(([day, items]) => {
        const total = items.reduce((s,i)=>s+i.amount,0);
        return (
          <div key={day} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 4px 8px' }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:PAL.ink, letterSpacing:'0.04em', textTransform:'uppercase' }}>{day}</div>
              <div style={{ fontSize:11.5, color:PAL.ink3, fontWeight:600 }}>
                <Money value={total} size={11.5} weight={600} color={PAL.ink3} dim={PAL.mute}/>
              </div>
            </div>
            <Card padding={0}>
              {items.map((e, i) => (
                <Fragment key={e.id}>
                  <ExpenseRow e={e} onClick={()=>onExpense(e)}/>
                  {i < items.length - 1 && <Divider inset={62} />}
                </Fragment>
              ))}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function ExpenseRow({ e, onClick }) {
  const payer = memberById(e.paidBy);
  const isMe = e.paidBy === 'lea';
  const myShare = e.amount / 4;
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer' }}>
      <CatBadge name={e.icon}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:PAL.ink, lineHeight:1.25, textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{e.label}</div>
        <div style={{ fontSize:11.5, color:PAL.ink3, marginTop:2, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
          {isMe ? <span style={{ color:PAL.pos, fontWeight:600 }}>Tu as payé</span> : <>Payé par <span style={{ color:PAL.ink2, fontWeight:600 }}>{payer.name}</span></>}
          <span style={{ color:PAL.mute }}>·</span>
          <span>÷ 4</span>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <Money value={e.amount} size={14} weight={700} color={PAL.ink}/>
        <div style={{ fontSize:11, color: isMe ? PAL.pos : PAL.neg, marginTop:1, fontWeight:600, fontFamily:'JetBrains Mono' }}>
          {isMe ? '+' : '−'}{(e.amount - myShare).toLocaleString('fr-FR',{ minimumFractionDigits:2, maximumFractionDigits:2 })}€
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Itinerary ───────────────────────────────────────────
function ItineraryTab({ trip }) {
  const days = ITINERARY.filter(d => d.tripId === trip.id);
  return (
    <div style={{ padding:'14px 16px 30px' }}>
      {/* Day strip */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6, marginBottom:14 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = i + 1;
          const dy = days.find(x => x.day === d);
          const active = d === trip.dayN;
          return (
            <div key={i} style={{
              minWidth:48, height:64, borderRadius:14,
              background: active ? PAL.ink : PAL.surface,
              color: active ? '#fff' : PAL.ink,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              border:`1px solid ${active?PAL.ink:PAL.line2}`, cursor:'pointer',
            }}>
              <div style={{ fontSize:10, fontWeight:600, color: active ? 'rgba(255,255,255,0.7)' : PAL.ink3, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                J{d}
              </div>
              <div style={{ fontFamily:'Plus Jakarta Sans', fontSize:16, fontWeight:700, marginTop:2 }}>
                {dy ? dy.date.split(' ')[0] : '—'}
              </div>
              <div style={{ fontSize:9.5, color: active ? 'rgba(255,255,255,0.6)' : PAL.mute, fontWeight:600, marginTop:1 }}>
                {dy ? dy.weekday : ''}
              </div>
            </div>
          );
        })}
      </div>

      {days.map((d, di) => (
        <div key={d.day} style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px 10px' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:PAL.ink3, fontWeight:600 }}>JOUR {d.day}</div>
            <div style={{ flex:1, height:1, background:PAL.line }}/>
            <div style={{ fontSize:11.5, color:PAL.ink2, fontWeight:700, textTransform:'capitalize' }}>{d.weekday} {d.date}</div>
            {d.highlight && <Chip tone="accent" size="sm">★ Sortie majeure</Chip>}
          </div>
          <Card padding={0}>
            {d.items.map((it, i) => (
              <Fragment key={i}>
                <div style={{ display:'flex', gap:12, padding:'12px 14px', alignItems:'flex-start' }}>
                  <div style={{ width:46, flexShrink:0, textAlign:'left' }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:PAL.ink, fontWeight:700 }}>{it.time}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                    <CatBadge name={it.icon} size={32}/>
                    {i < d.items.length - 1 && <div style={{ width:2, flex:1, minHeight:14, background:PAL.line, marginTop:6 }}/>}
                  </div>
                  <div style={{ flex:1, paddingBottom: i < d.items.length - 1 ? 6 : 0 }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:PAL.ink, lineHeight:1.3 }}>{it.title}</div>
                    <div style={{ fontSize:11.5, color:PAL.ink3, fontWeight:500, marginTop:2 }}>{it.meta}</div>
                  </div>
                </div>
                {i < d.items.length - 1 && <Divider inset={72}/>}
              </Fragment>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Balance ─────────────────────────────────────────────
function BalanceTab({ trip, onSettle }) {
  // Per-person totals
  const stats = MEMBERS.map(m => {
    const paid = EXPENSES.filter(e => e.tripId === trip.id && e.paidBy === m.id)
                         .reduce((s,e) => s+e.amount, 0);
    const share = EXPENSES.filter(e => e.tripId === trip.id).reduce((s,e)=>s+e.amount,0) / 4;
    return { ...m, paid, share, net: paid - share };
  });
  const maxAbs = Math.max(...stats.map(s => Math.abs(s.net))) || 1;

  return (
    <div style={{ padding:'14px 16px 30px', display:'flex', flexDirection:'column', gap:12 }}>
      {/* Net by person */}
      <Card>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Position par personne</div>
          <Chip tone="ghost" size="sm">{trip.currency} EUR</Chip>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {stats.map(s => {
            const pct = (Math.abs(s.net) / maxAbs) * 100;
            const pos = s.net >= 0;
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar id={s.id} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span style={{ fontSize:12.5, fontWeight:700, color:PAL.ink }}>
                      {s.name}{s.id==='lea'?' (toi)':''}
                    </span>
                    <Money value={s.net} size={12.5} weight={700} color={pos?PAL.pos:PAL.neg} sign={pos?'pos':'neg'}/>
                  </div>
                  <div style={{ position:'relative', height:6, background:PAL.bg, borderRadius:99, marginTop:5, overflow:'hidden' }}>
                    <div style={{
                      position:'absolute', left:'50%', top:0, bottom:0,
                      width:`${pct/2}%`, borderRadius:99,
                      transform: pos ? 'none' : 'translateX(-100%)',
                      background: pos ? PAL.pos : PAL.neg,
                      transformOrigin: pos ? 'left' : 'right',
                    }}/>
                    <div style={{ position:'absolute', left:'50%', top:-1, bottom:-1, width:1, background:PAL.line2 }}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Suggested settlements */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 4px 0' }}>
        <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Remboursements optimisés</div>
        <Chip tone="accent" size="sm">{BALANCES.length} transferts</Chip>
      </div>
      <Card padding={0}>
        {BALANCES.map((b, i) => {
          const from = memberById(b.from), to = memberById(b.to);
          const isMine = b.from === 'lea';
          return (
            <Fragment key={i}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                <Avatar id={b.from} size={32}/>
                <IcArrowR size={16} sw={2.2} style={{ color: PAL.ink3 }}/>
                <Avatar id={b.to} size={32}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:PAL.ink }}>
                    {isMine ? 'Tu' : from.name} → {to.name}
                  </div>
                  <div style={{ fontSize:11.5, color:PAL.ink3, fontWeight:500, marginTop:1 }}>
                    {isMine ? 'Virement à effectuer' : 'En attente'}
                  </div>
                </div>
                <Money value={b.amount} size={14} weight={700} color={isMine?PAL.neg:PAL.ink2}/>
              </div>
              {i < BALANCES.length - 1 && <Divider inset={64}/>}
            </Fragment>
          );
        })}
      </Card>

      <button onClick={onSettle} style={{
        height:50, borderRadius:14, border:'none', background:PAL.ink, color:'#fff',
        fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:14,
        display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer',
      }}>
        <IcSwap size={17} sw={2}/> Marquer mes paiements comme effectués
      </button>
    </div>
  );
}

Object.assign(window, { TripScreen, TripHeader, TripTabs, OverviewTab, ExpensesTab, ItineraryTab, BalanceTab, ExpenseRow });
