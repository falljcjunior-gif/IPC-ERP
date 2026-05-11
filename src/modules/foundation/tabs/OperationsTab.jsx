/**
 * Foundation — Opérations Terrain
 * Collecteurs, Centres de Tri, Tracking Plastique
 *
 * Firestore :
 *   foundation_collecteurs/{id}  — Registre des collecteurs terrain
 *   foundation_centres/{id}      — Dashboard par centre de tri
 *   foundation_collectes/{id}    — Tonnage reçu par centre/collecteur
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  UserCheck, Factory, Recycle, Plus, Search, Package,
  Wrench, CheckCircle2, AlertTriangle, MapPin, Phone,
  CreditCard, Save, Trash2, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useToastStore } from '../../../store/useToastStore';

const T = { bg:'#0a0c10', surface:'#0d1117', card:'#111318', border:'#1f2937', accent:'#2ecc71', accentDim:'rgba(46,204,113,0.12)', text:'#e5e7eb', muted:'#6b7280' };

// ── Mock data ──────────────────────────────────────────────────
const COLLECTEURS_INIT = [
  { id:'co1', prenom:'Kouassi', nom:'Amon',    zone:'Yopougon-Lavage', tel:'0708123456', carte:'COL-2025-001', actif:true,  tonnage:12.4 },
  { id:'co2', prenom:'Bamba',   nom:'Sita',    zone:'Abobo-Sagbé',     tel:'0103456789', carte:'COL-2025-002', actif:true,  tonnage:9.1  },
  { id:'co3', prenom:'Coulibaly',nom:'Ibrahim',zone:'Koumassi-Remblais',tel:'0505112233', carte:'COL-2025-003', actif:false, tonnage:4.3  },
  { id:'co4', prenom:'N\'Guessan',nom:'Marie', zone:'Yopougon-Sideci', tel:'0101987654', carte:'COL-2025-004', actif:true,  tonnage:18.7 },
];
const CENTRES_INIT = [
  { id:'ctr1', nom:'Centre Yopougon',  localisation:'Yopougon-Garage',   capacite:60, stock:38.5, machines:3, chef:'Koné Mamadou',   statut:'operationnel' },
  { id:'ctr2', nom:'Centre Abobo',     localisation:'Abobo-Marché',      capacite:40, stock:24.2, machines:2, chef:'Traoré Moussa',  statut:'operationnel' },
  { id:'ctr3', nom:'Centre Cocody',    localisation:'Cocody-Riviera 3',   capacite:50, stock:0,    machines:1, chef:'Diallo Fatouma',statut:'installation' },
  { id:'ctr4', nom:'Centre Koumassi',  localisation:'Koumassi-Remblais', capacite:30, stock:14.3, machines:2, chef:'Aka Rémi',       statut:'operationnel' },
];
const COLLECTES_INIT = [
  { id:'cl1', date:'2025-05-09', centreId:'ctr1', collecteur:'COL-2025-004', tonnage:3.2, type:'PET', statut:'trie'    },
  { id:'cl2', date:'2025-05-09', centreId:'ctr2', collecteur:'COL-2025-002', tonnage:1.8, type:'HDPE',statut:'recu'   },
  { id:'cl3', date:'2025-05-08', centreId:'ctr1', collecteur:'COL-2025-001', tonnage:2.5, type:'PET', statut:'recycle' },
  { id:'cl4', date:'2025-05-08', centreId:'ctr4', collecteur:'COL-2025-003', tonnage:1.1, type:'PP',  statut:'pese'   },
  { id:'cl5', date:'2025-05-07', centreId:'ctr2', collecteur:'COL-2025-002', tonnage:2.2, type:'PET', statut:'recycle' },
];
const TYPES_PLASTIQUE = ['PET','HDPE','PVC','LDPE','PP','PS','Autre'];
const STATUTS_COLLECTE = {
  recu:    { color:'#6366F1', label:'Reçu'    },
  pese:    { color:'#F59E0B', label:'Pesé'    },
  trie:    { color:'#06B6D4', label:'Trié'    },
  recycle: { color:'#2ecc71', label:'Recyclé' },
};
const STATUTS_CENTRE = {
  operationnel: { color:'#2ecc71', label:'Opérationnel' },
  maintenance:  { color:'#F59E0B', label:'Maintenance'  },
  installation: { color:'#6366F1', label:'Installation' },
  ferme:        { color:'#EF4444', label:'Fermé'        },
};

const fmt1 = n => new Intl.NumberFormat('fr-FR', { minimumFractionDigits:1 }).format(n);
const EMPTY_COL  = { prenom:'', nom:'', zone:'', tel:'', carte:'' };
const EMPTY_SAISIE = { date:'', centreId:'', collecteur:'', tonnage:'', type:'PET' };

const Input = ({ label, required, ...props }) => (
  <div>
    <label style={{ fontSize:'0.72rem', fontWeight:700, color:T.muted, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>
      {label}{required && <span style={{ color:'#EF4444', marginLeft:3 }}>*</span>}
    </label>
    <input {...props} style={{ width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${T.border}`, background:T.surface, color:T.text, fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }} />
  </div>
);

const Select = ({ label, required, options, ...props }) => (
  <div>
    <label style={{ fontSize:'0.72rem', fontWeight:700, color:T.muted, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>
      {label}{required && <span style={{ color:'#EF4444', marginLeft:3 }}>*</span>}
    </label>
    <select {...props} style={{ width:'100%', padding:'0.65rem 0.9rem', borderRadius:'0.5rem', border:`1px solid ${T.border}`, background:T.surface, color:T.text, fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }}>
      <option value="">Sélectionner…</option>
      {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
    </select>
  </div>
);

const CardSection = ({ title, icon: Icon, color, children }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:'1rem', overflow:'hidden' }}>
    <div style={{ padding:'1rem 1.5rem', borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:'0.9rem', color:T.text, display:'flex', alignItems:'center', gap:8 }}>
      <Icon size={15} color={color || T.accent} />{title}
    </div>
    {children}
  </div>
);

export default function OperationsTab() {
  const [view, setView]       = useState('centres');  // centres | collecteurs | tracking
  const [collecteurs, setCols] = useState(COLLECTEURS_INIT);
  const [centres]              = useState(CENTRES_INIT);
  const [collectes, setColls]  = useState(COLLECTES_INIT);
  const [colForm, setColForm]  = useState(EMPTY_COL);
  const [saisie, setSaisie]    = useState(EMPTY_SAISIE);
  const [search, setSearch]    = useState('');
  const [selCentre, setSel]    = useState(null);
  const { addToast } = useToastStore();

  const colsFilt = useMemo(() => collecteurs.filter(c => {
    const q = search.toLowerCase();
    return !q || c.nom.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q) || c.carte.toLowerCase().includes(q);
  }), [collecteurs, search]);

  const totalTonnage = collectes.reduce((s, c) => s + c.tonnage, 0);
  const totalRecycle = collectes.filter(c => c.statut === 'recycle').reduce((s, c) => s + c.tonnage, 0);

  const barData = CENTRES_INIT.map(c => ({ nom: c.nom.replace('Centre ', ''), stock: c.stock, capacite: c.capacite }));

  const addCollecteur = () => {
    if (!colForm.prenom || !colForm.nom || !colForm.zone || !colForm.tel) { addToast('Champs requis manquants', 'error'); return; }
    const next = `COL-2025-00${collecteurs.length + 1}`;
    setCols(prev => [...prev, { id:`co${Date.now()}`, ...colForm, carte: next, actif: true, tonnage: 0 }]);
    setColForm(EMPTY_COL);
    addToast(`Collecteur ${colForm.prenom} ${colForm.nom} enregistré — Carte ${next}`, 'success');
  };

  const addCollecte = () => {
    if (!saisie.date || !saisie.centreId || !saisie.collecteur || !saisie.tonnage) { addToast('Remplissez tous les champs', 'error'); return; }
    setColls(prev => [{ id:`cl${Date.now()}`, ...saisie, tonnage: parseFloat(saisie.tonnage), statut:'recu' }, ...prev]);
    setSaisie(EMPTY_SAISIE);
    addToast(`${saisie.tonnage}t de ${saisie.type} enregistré`, 'success');
  };

  const VIEWS = [
    { id:'centres',     label:'Centres de Tri',  icon: Factory },
    { id:'collecteurs', label:'Collecteurs',      icon: UserCheck },
    { id:'tracking',    label:'Tracking Plastique', icon: Recycle },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:4, background:T.surface, padding:4, borderRadius:'0.75rem', border:`1px solid ${T.border}`, width:'fit-content' }}>
        {VIEWS.map(v => { const Icon = v.icon; return (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'0.5rem 1rem', borderRadius:'0.5rem', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', transition:'all 0.15s',
              background: view===v.id ? T.accent : 'transparent', color: view===v.id ? '#000' : T.muted }}>
            <Icon size={13}/>{v.label}
          </button>
        );})}
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
        {[
          { label:'Tonnage Total', value:`${fmt1(totalTonnage)}t`, color:T.accent },
          { label:'Recyclé',       value:`${fmt1(totalRecycle)}t`, color:'#06B6D4' },
          { label:'Collecteurs',   value:collecteurs.filter(c=>c.actif).length, color:'#6366F1' },
          { label:'Centres actifs',value:centres.filter(c=>c.statut==='operationnel').length, color:'#F59E0B' },
        ].map((k,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:'0.875rem', padding:'1rem 1.25rem', borderTop:`2px solid ${k.color}` }}>
            <div style={{ fontWeight:900, fontSize:'1.4rem', color:k.color }}>{k.value}</div>
            <div style={{ fontSize:'0.7rem', color:T.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CENTRES DE TRI ────────────────────────────────── */}
        {view === 'centres' && (
          <motion.div key="centres" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
            {/* Bar chart */}
            <CardSection title="Stock vs Capacité par Centre (tonnes)" icon={Factory}>
              <div style={{ padding:'1.25rem' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{top:5,right:5,bottom:0,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="nom" tick={{fontSize:11,fill:T.muted}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false} unit="t" />
                    <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text}} />
                    <Bar dataKey="capacite" fill={`${T.accent}30`} radius={[4,4,0,0]} name="Capacité" />
                    <Bar dataKey="stock"    fill={T.accent}       radius={[4,4,0,0]} name="Stock actuel" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardSection>

            {/* Grille centres */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1rem' }}>
              {centres.map(c => {
                const cfg = STATUTS_CENTRE[c.statut];
                const pct = Math.round((c.stock/c.capacite)*100)||0;
                return (
                  <div key={c.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:'1rem', overflow:'hidden', cursor:'pointer' }}
                    onClick={()=>setSel(selCentre===c.id?null:c.id)}>
                    <div style={{ padding:'0.875rem 1.25rem', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:`${cfg.color}08` }}>
                      <div style={{ fontWeight:700, fontSize:'0.9rem', color:T.text, display:'flex', alignItems:'center', gap:8 }}><Factory size={14} color={cfg.color}/>{c.nom}</div>
                      <span style={{ fontSize:'0.65rem', fontWeight:800, color:cfg.color, background:`${cfg.color}18`, border:`1px solid ${cfg.color}30`, borderRadius:'0.3rem', padding:'2px 7px' }}>{cfg.label}</span>
                    </div>
                    <div style={{ padding:'1rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                      <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.8rem' }}>
                        <span style={{color:T.muted}}><MapPin size={11}/> {c.localisation}</span>
                        <span style={{color:T.muted}}>Chef : <strong style={{color:T.text}}>{c.chef}</strong></span>
                      </div>
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.78rem',fontWeight:700,marginBottom:5}}>
                          <span style={{color:T.muted}}>Stock / Capacité</span>
                          <span style={{color:T.accent}}>{fmt1(c.stock)}t / {c.capacite}t</span>
                        </div>
                        <div style={{height:6,background:T.surface,borderRadius:999,overflow:'hidden'}}>
                          <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8}}
                            style={{height:'100%',background:pct>80?'#EF4444':T.accent,borderRadius:999}}/>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'1rem',fontSize:'0.75rem'}}>
                        <span style={{color:T.muted}}>🔧 <strong style={{color:T.text}}>{c.machines}</strong> machine(s)</span>
                        <span style={{color:T.muted}}>📦 {pct}% capacité</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── COLLECTEURS ──────────────────────────────────── */}
        {view === 'collecteurs' && (
          <motion.div key="collecteurs" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:'1.5rem'}}>
            {/* Form */}
            <CardSection title="Enregistrer un Collecteur" icon={Plus}>
              <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'0.9rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <Input label="Prénom *" placeholder="Kouassi" value={colForm.prenom} onChange={e=>setColForm(f=>({...f,prenom:e.target.value}))} />
                  <Input label="Nom *"    placeholder="Amon"     value={colForm.nom}    onChange={e=>setColForm(f=>({...f,nom:e.target.value}))} />
                </div>
                <Input label="Zone d'activité *" placeholder="Yopougon-Lavage" value={colForm.zone} onChange={e=>setColForm(f=>({...f,zone:e.target.value}))} />
                <Input label="Téléphone *" type="tel" placeholder="07XXXXXXXX" value={colForm.tel} onChange={e=>setColForm(f=>({...f,tel:e.target.value}))} />
                <div style={{background:T.surface,border:`1px dashed ${T.border}`,borderRadius:'0.5rem',padding:'0.75rem',textAlign:'center'}}>
                  <CreditCard size={16} color={T.muted} style={{marginBottom:4}}/>
                  <div style={{fontSize:'0.78rem',color:T.muted}}>N° carte généré automatiquement</div>
                  <div style={{fontSize:'0.75rem',color:T.accent,marginTop:2,fontFamily:'monospace'}}>COL-2025-00{collecteurs.length+1}</div>
                </div>
                <button onClick={addCollecteur}
                  style={{padding:'0.85rem',borderRadius:'0.5rem',border:'none',background:T.accent,color:'#000',fontWeight:800,cursor:'pointer'}}>
                  ✓ Enregistrer le Collecteur
                </button>
              </div>
            </CardSection>

            {/* Liste */}
            <CardSection title={`Registre Collecteurs (${collecteurs.filter(c=>c.actif).length} actifs)`} icon={UserCheck}>
              <div style={{padding:'0.875rem 1.25rem',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:8}}>
                <Search size={14} color={T.muted}/>
                <input placeholder="Nom, zone, carte…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:'0.85rem',color:T.text}}/>
              </div>
              <div>
                {colsFilt.map(c=>(
                  <div key={c.id} style={{padding:'0.875rem 1.25rem',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:`${T.accent}18`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.9rem',color:T.accent,flexShrink:0}}>
                      {c.prenom[0]}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:'0.87rem',color:T.text}}>{c.prenom} {c.nom}</div>
                      <div style={{fontSize:'0.73rem',color:T.muted,display:'flex',gap:'0.75rem',marginTop:2}}>
                        <span><MapPin size={10}/> {c.zone}</span>
                        <span><Phone size={10}/> {c.tel}</span>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:T.accent,fontWeight:700}}>{c.carte}</div>
                      <div style={{fontSize:'0.78rem',color:T.muted,marginTop:2}}>{c.tonnage}t collectés</div>
                    </div>
                    <span style={{fontSize:'0.65rem',fontWeight:800,color:c.actif?T.accent:'#EF4444',background:`${c.actif?T.accent:'#EF4444'}18`,borderRadius:'0.3rem',padding:'2px 6px'}}>
                      {c.actif?'Actif':'Inactif'}
                    </span>
                  </div>
                ))}
              </div>
            </CardSection>
          </motion.div>
        )}

        {/* ── TRACKING PLASTIQUE ────────────────────────────── */}
        {view === 'tracking' && (
          <motion.div key="tracking" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            {/* Saisie */}
            <CardSection title="Saisie Tonnage Reçu" icon={Package}>
              <div style={{padding:'1.5rem',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0.875rem'}}>
                <Input label="Date *" type="date" value={saisie.date} onChange={e=>setSaisie(s=>({...s,date:e.target.value}))} />
                <Select label="Centre *" options={CENTRES_INIT.map(c=>({val:c.id,label:c.nom}))} value={saisie.centreId} onChange={e=>setSaisie(s=>({...s,centreId:e.target.value}))} />
                <Select label="Collecteur *" options={collecteurs.filter(c=>c.actif).map(c=>({val:c.carte,label:`${c.prenom} ${c.nom} — ${c.carte}`}))} value={saisie.collecteur} onChange={e=>setSaisie(s=>({...s,collecteur:e.target.value}))} />
                <Input label="Tonnage (t) *" type="number" step="0.1" placeholder="0.0" value={saisie.tonnage} onChange={e=>setSaisie(s=>({...s,tonnage:e.target.value}))} />
                <Select label="Type Plastique" options={TYPES_PLASTIQUE.map(t=>({val:t,label:t}))} value={saisie.type} onChange={e=>setSaisie(s=>({...s,type:e.target.value}))} />
                <div style={{display:'flex',alignItems:'flex-end'}}>
                  <button onClick={addCollecte}
                    style={{width:'100%',padding:'0.65rem',borderRadius:'0.5rem',border:'none',background:T.accent,color:'#000',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    <Save size={14}/> Enregistrer
                  </button>
                </div>
              </div>
            </CardSection>

            {/* Log collectes */}
            <CardSection title="Journal des Collectes" icon={Recycle} color="#06B6D4">
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.surface}}>
                    {['Date','Centre','Collecteur','Tonnage','Type','Statut'].map(h=>(
                      <th key={h} style={{padding:'0.65rem 1.25rem',textAlign:'left',fontSize:'0.67rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',color:T.muted}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {collectes.map((c,i)=>{
                    const ctr = CENTRES_INIT.find(x=>x.id===c.centreId);
                    const cfg = STATUTS_COLLECTE[c.statut];
                    return(
                      <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:'0.75rem 1.25rem',fontSize:'0.82rem',color:T.muted}}>{c.date}</td>
                        <td style={{padding:'0.75rem 1.25rem',fontSize:'0.85rem',color:T.text,fontWeight:600}}>{ctr?.nom||c.centreId}</td>
                        <td style={{padding:'0.75rem 1.25rem',fontSize:'0.8rem',color:T.muted,fontFamily:'monospace'}}>{c.collecteur}</td>
                        <td style={{padding:'0.75rem 1.25rem',fontWeight:800,color:T.accent}}>{c.tonnage}t</td>
                        <td style={{padding:'0.75rem 1.25rem',fontSize:'0.78rem',color:T.muted}}>{c.type}</td>
                        <td style={{padding:'0.75rem 1.25rem'}}>
                          <span style={{fontSize:'0.68rem',fontWeight:800,color:cfg.color,background:`${cfg.color}15`,border:`1px solid ${cfg.color}30`,borderRadius:'0.3rem',padding:'2px 7px'}}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
