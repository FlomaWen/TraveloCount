// Bottom sheets: AddExpense, Settle, ExpenseDetail
const { useState: useStateS } = React;

function Sheet({ children, onClose, height = 'auto', title, action }) {
  return (
    <>
      <div onClick={onClose} style={{
        position:'absolute', inset:0, background:'rgba(12,26,34,0.45)',
        zIndex:30, animation:'fadeIn 0.2s ease',
      }}/>
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, zIndex:31,
        background:PAL.surface, borderTopLeftRadius:28, borderTopRightRadius:28,
        paddingBottom: HOME_H,
        maxHeight: '90%', height,
        display:'flex', flexDirection:'column',
        animation:'slideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow:'0 -10px 30px rgba(12,26,34,0.20)',
      }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:99, background:PAL.line2 }}/>
        </div>
        {title && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px 8px' }}>
            <button onClick={onClose} style={{ background:'none', border:'none', color:PAL.ink3, fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
            <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>{title}</div>
            {action || <div style={{ width:40 }}/>}
          </div>
        )}
        <div style={{ flex:1, overflowY:'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
}

function AddExpenseSheet({ onClose, tripId }) {
  const [amount, setAmount] = useStateS('86,40');
  const [label, setLabel] = useStateS('Dîner Bairro Alto');
  const [cat, setCat] = useStateS('food');
  const [paidBy, setPaidBy] = useStateS('lea');
  const [splitMode, setSplitMode] = useStateS('equal');
  const [selected, setSelected] = useStateS({ lea:true, marc:true, sofia:true, tom:true });

  const cats = [
    { id:'transport', label:'Transport', icon:'car' },
    { id:'food',      label:'Resto',     icon:'fork' },
    { id:'lodging',   label:'Logement',  icon:'bed' },
    { id:'activity',  label:'Activité',  icon:'ticket' },
    { id:'shopping',  label:'Shopping',  icon:'receipt' },
  ];

  return (
    <Sheet onClose={onClose} title="Nouvelle dépense"
      action={<button style={{
        background:PAL.ink, color:'#fff', border:'none', borderRadius:9, padding:'7px 12px',
        fontWeight:700, fontSize:12, fontFamily:'Plus Jakarta Sans', cursor:'pointer',
      }} onClick={onClose}>Ajouter</button>}>
      <div style={{ padding:'10px 16px 24px' }}>
        {/* Amount big */}
        <div style={{
          padding:'24px 0 22px', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          borderBottom:`1px solid ${PAL.line}`,
        }}>
          <div style={{ fontSize:11, color:PAL.ink3, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Montant</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:54, fontWeight:600, color:PAL.ink, letterSpacing:'-0.04em', fontVariantNumeric:'tabular-nums' }}>{amount}</span>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:24, fontWeight:500, color:PAL.ink3 }}>€</span>
          </div>
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            {['EUR','USD','GBP','+'].map((c,i)=>(
              <Chip key={c} tone={i===0?'dark':'ghost'} size="sm">{c}</Chip>
            ))}
          </div>
        </div>

        {/* Label */}
        <div style={{ padding:'16px 0 8px' }}>
          <Label>Description</Label>
          <div style={{
            display:'flex', alignItems:'center', gap:10, background:PAL.bg, padding:'12px 14px', borderRadius:14,
          }}>
            <IcEdit size={16} sw={1.8} style={{ color:PAL.ink3 }}/>
            <input value={label} onChange={e=>setLabel(e.target.value)} style={{
              flex:1, border:'none', background:'transparent', outline:'none',
              fontFamily:'Plus Jakarta Sans', fontSize:14, fontWeight:600, color:PAL.ink,
            }}/>
            <Chip tone="accent" size="sm"><IcSparkle size={11} sw={1.8}/> Auto</Chip>
          </div>
        </div>

        {/* Category */}
        <div style={{ padding:'12px 0 8px' }}>
          <Label>Catégorie</Label>
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginLeft:-4, paddingLeft:4 }}>
            {cats.map(c => {
              const active = c.id === cat;
              return (
                <button key={c.id} onClick={()=>setCat(c.id)} style={{
                  display:'flex', alignItems:'center', gap:7, padding:'9px 12px',
                  background: active ? PAL.ink : PAL.bg, color: active ? '#fff' : PAL.ink2,
                  borderRadius:12, border:'none', fontFamily:'Plus Jakarta Sans',
                  fontWeight:600, fontSize:12.5, cursor:'pointer', whiteSpace:'nowrap',
                }}>
                  <CatIcon name={c.icon} size={15} color={active?'#fff':PAL.ink2}/>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paid by */}
        <div style={{ padding:'12px 0 8px' }}>
          <Label>Payé par</Label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {MEMBERS.map(m => {
              const active = m.id === paidBy;
              return (
                <button key={m.id} onClick={()=>setPaidBy(m.id)} style={{
                  display:'flex', alignItems:'center', gap:8, padding:'6px 12px 6px 6px',
                  background: active ? PAL.ink : PAL.bg,
                  color: active ? '#fff' : PAL.ink2,
                  borderRadius:99, border:'none', fontFamily:'Plus Jakarta Sans',
                  fontWeight:600, fontSize:12.5, cursor:'pointer',
                }}>
                  <Avatar id={m.id} size={26}/>
                  {m.id === 'lea' ? 'Toi' : m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split */}
        <div style={{ padding:'14px 0 8px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <Label noMargin>Partager entre</Label>
            <div style={{ display:'flex', gap:4, background:PAL.bg, padding:3, borderRadius:10 }}>
              {[['equal','Égal'],['percent','%'],['shares','Parts'],['custom','Exact']].map(([id,t])=>(
                <button key={id} onClick={()=>setSplitMode(id)} style={{
                  padding:'5px 10px', borderRadius:8, border:'none',
                  background: splitMode===id ? PAL.surface : 'transparent',
                  color: splitMode===id ? PAL.ink : PAL.ink3,
                  fontFamily:'Plus Jakarta Sans', fontWeight:600, fontSize:11,
                  boxShadow: splitMode===id ? '0 1px 2px rgba(47,69,80,0.10)' : 'none',
                  cursor:'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ background:PAL.bg, borderRadius:14, overflow:'hidden' }}>
            {MEMBERS.map((m, i) => {
              const checked = selected[m.id];
              const per = parseFloat(amount.replace(',','.'))/4;
              return (
                <div key={m.id} onClick={()=>setSelected(s=>({...s, [m.id]:!s[m.id]}))} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                  borderBottom: i < MEMBERS.length - 1 ? `1px solid ${PAL.line}` : 'none',
                  cursor:'pointer',
                }}>
                  <div style={{
                    width:20, height:20, borderRadius:6, border:`1.5px solid ${checked?PAL.ink:PAL.line2}`,
                    background: checked ? PAL.ink : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    {checked && <IcCheck size={13} sw={2.5} style={{ color:'#fff' }}/>}
                  </div>
                  <Avatar id={m.id} size={26}/>
                  <div style={{ flex:1, fontSize:13, fontWeight:600, color:checked?PAL.ink:PAL.ink3 }}>
                    {m.id==='lea'?'Toi':m.name}
                  </div>
                  <Money value={checked?per:0} size={12.5} weight={600} color={checked?PAL.ink2:PAL.mute}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

const Label = ({ children, noMargin }) => (
  <div style={{ fontSize:11, color:PAL.ink3, fontWeight:700, letterSpacing:'0.08em',
                textTransform:'uppercase', marginBottom: noMargin ? 0 : 8 }}>
    {children}
  </div>
);

function SettleSheet({ onClose }) {
  const myTransfers = BALANCES.filter(b => b.from === 'lea');
  const [done, setDone] = useStateS({});
  const total = myTransfers.reduce((s, t) => s + t.amount, 0);
  return (
    <Sheet onClose={onClose} title="Régler tes comptes">
      <div style={{ padding:'14px 16px 24px' }}>
        <div style={{
          background:PAL.ink, color:'#fff', borderRadius:18, padding:'18px 18px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.65)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>À reverser</div>
            <Money value={total} size={26} weight={700} color="#fff" dim="rgba(255,255,255,0.65)" sign="neg"/>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.65)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Bénéficiaires</div>
            <div style={{ marginTop:4, display:'flex', justifyContent:'flex-end' }}>
              <AvatarStack ids={myTransfers.map(t=>t.to)} size={26}/>
            </div>
          </div>
        </div>

        <div style={{ marginTop:18, marginBottom:8 }}>
          <Label>Étapes suggérées</Label>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {myTransfers.map((t,i) => {
            const to = memberById(t.to);
            const isDone = done[i];
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'14px 14px',
                background: isDone ? 'rgba(47,122,106,0.08)' : PAL.bg, borderRadius:14,
                opacity: isDone ? 0.7 : 1,
              }}>
                <Avatar id={t.to} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:PAL.ink }}>Payer {to.name}</div>
                  <div style={{ fontSize:11.5, color:PAL.ink3, marginTop:1, fontWeight:500 }}>
                    Via IBAN · FR76 •••• 4382
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <Money value={t.amount} size={14} weight={700} color={isDone?PAL.pos:PAL.ink}/>
                  <button onClick={()=>setDone(d=>({...d,[i]:!d[i]}))} style={{
                    marginTop:5, padding:'4px 10px', borderRadius:8, border:'none',
                    background: isDone ? PAL.pos : PAL.ink, color:'#fff',
                    fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:11, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    {isDone ? <><IcCheck size={11} sw={2.5}/> Payé</> : 'Marquer payé'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button style={{
          marginTop:18, width:'100%', height:50, borderRadius:14, border:'none', cursor:'pointer',
          background: PAL.accent, color:'#1F3E3A',
          fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:14,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          <IcSparkle size={16} sw={1.9}/> Ouvrir mon app bancaire
        </button>
      </div>
    </Sheet>
  );
}

function ExpenseDetailSheet({ e, onClose }) {
  const payer = memberById(e.paidBy);
  const per = e.amount / 4;
  return (
    <Sheet onClose={onClose} title="Détail de la dépense">
      <div style={{ padding:'14px 16px 30px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'6px 0 18px' }}>
          <CatBadge name={e.icon} size={48}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:700, color:PAL.ink, letterSpacing:'-0.01em' }}>{e.label}</div>
            <div style={{ fontSize:12, color:PAL.ink3, marginTop:2, fontWeight:500 }}>
              {e.dayLabel} · {new Date(e.date).toLocaleDateString('fr-FR',{weekday:'short', day:'numeric', month:'short'})}
            </div>
          </div>
        </div>

        <Card padding={0}>
          <Row label="Montant"><Money value={e.amount} size={15} weight={700}/></Row>
          <Divider/>
          <Row label="Payé par">
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Avatar id={e.paidBy} size={22}/>
              <span style={{ fontSize:13, fontWeight:600, color:PAL.ink2 }}>{payer.name}</span>
            </div>
          </Row>
          <Divider/>
          <Row label="Méthode">
            <Chip tone="default" size="sm">Carte · Revolut</Chip>
          </Row>
        </Card>

        <div style={{ marginTop:18, marginBottom:8 }}>
          <Label>Répartition · part par personne {per.toFixed(2).replace('.',',')}€</Label>
        </div>
        <Card padding={0}>
          {MEMBERS.map((m, i) => (
            <Fragment key={m.id}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                <Avatar id={m.id} size={28}/>
                <div style={{ flex:1, fontSize:13, fontWeight:600, color:PAL.ink }}>
                  {m.id==='lea'?'Toi':m.name}
                </div>
                <Money value={per} size={13} weight={600} color={PAL.ink2}/>
              </div>
              {i < MEMBERS.length - 1 && <Divider inset={56}/>}
            </Fragment>
          ))}
        </Card>

        <div style={{ marginTop:18, display:'flex', gap:8 }}>
          <button style={{
            flex:1, height:46, borderRadius:12, border:`1px solid ${PAL.line2}`, background:PAL.surface,
            color:PAL.ink, fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:13.5,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer',
          }}>
            <IcEdit size={15} sw={1.9}/> Modifier
          </button>
          <button style={{
            flex:1, height:46, borderRadius:12, border:'none', background:PAL.ink,
            color:'#fff', fontFamily:'Plus Jakarta Sans', fontWeight:700, fontSize:13.5,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer',
          }}>
            <IcCamera size={15} sw={1.9}/> Joindre reçu
          </button>
        </div>
      </div>
    </Sheet>
  );
}

const Row = ({ label, children }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 14px' }}>
    <div style={{ fontSize:12.5, color:PAL.ink3, fontWeight:600 }}>{label}</div>
    {children}
  </div>
);

Object.assign(window, { Sheet, AddExpenseSheet, SettleSheet, ExpenseDetailSheet, Label, Row });
