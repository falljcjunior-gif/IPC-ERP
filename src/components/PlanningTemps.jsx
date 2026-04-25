import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Plus, Check,
  X, BarChart3, Target, AlertCircle, Briefcase, Users,
  CheckCircle2, XCircle, TrendingUp, Timer, ClipboardList
} from 'lucide-react';
import { useStore } from '../store';
import RecordModal from './RecordModal';
import KpiCard from './KpiCard';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const HOUR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#EC4899'];

const chip = (label, color = '#64748B') => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 700 }}>{label}</span>
);

/* ── Tiny Tab Toggle ── */
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '1rem', border: '1px solid var(--border)', gap: '4px', width: 'fit-content' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.45rem 1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: active === t.id ? 'var(--accent)' : 'transparent', color: active === t.id ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.18s' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

/* ════════════════════════════════════════════
   PLANNING CALENDAR VIEW
════════════════════════════════════════════ */
const PlanningView = () => {
  const { data, currentUser, addRecord } = useStore();
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Gather events from multiple sources
  const allEvents = useMemo(() => {
    const events = [];

    // My leaves (approved)
    (data.hr?.leaves || []).filter(l => l.employe === currentUser?.nom && l.statut === 'Validé').forEach(l => {
      const start = new Date(l.du || l.date_debut);
      const end = new Date(l.au || l.date_fin);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        events.push({ date: d.toISOString().split('T')[0], title: `🏖️ ${l.type}`, color: '#8B5CF6', type: 'leave' });
      }
    });

    // My timesheets
    (data.hr?.timesheets || []).filter(t => t.collaborateur === currentUser?.nom).forEach(t => {
      if (t.date) events.push({ date: t.date, title: `⏱ ${t.projet} – ${t.heures}h`, color: '#3B82F6', type: 'timesheet' });
    });

    // Projects I'm on (deadline)
    (data.projects?.projects || []).filter(p => p.team?.some(tm => tm.nom === currentUser?.nom) || p.chefProjet === currentUser?.nom).forEach(p => {
      if (p.echeance || p.dateFin) {
        events.push({ date: p.echeance || p.dateFin, title: `📌 Échéance: ${p.nom}`, color: '#EF4444', type: 'project' });
      }
    });

    // System events (from planning module)
    (data.planning?.events || []).forEach(ev => {
      events.push({ ...ev, color: ev.color || '#10B981', type: 'event' });
    });

    return events;
  }, [data, currentUser?.nom]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setShowModal(true);
  };

  const cells = [];
  // Empty cells before day 1
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isTodayCell = (day) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={prevMonth} className="btn" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>{MONTHS_FR[month]} {year}</h2>
          <button onClick={nextMonth} className="btn" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 700 }}>
          {[['#8B5CF6','Congés'],['#3B82F6','Temps'],['#EF4444','Échéances'],['#10B981','Événements']].map(([c,lab]) => (
            <span key={lab} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />{lab}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
            <div key={d} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', background: 'var(--bg-subtle)' }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (day === null) return (
              <div key={`e${i}`} style={{ minHeight: 100, background: 'var(--bg-subtle)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', opacity: 0.4 }} />
            );
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvs = allEvents.filter(e => e.date === dateStr);
            const isToday = isTodayCell(day);
            return (
              <motion.div
                key={day}
                whileHover={{ background: 'var(--bg-subtle)' }}
                onClick={() => handleDayClick(day)}
                style={{ minHeight: 100, padding: '0.5rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? 'white' : 'var(--text)', marginBottom: '0.3rem' }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {dayEvs.slice(0, 3).map((ev, idx) => (
                    <div key={idx} title={ev.title} style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: `${ev.color}20`, color: ev.color, borderLeft: `2px solid ${ev.color}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvs.length > 3 && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>+{dayEvs.length - 3} de plus</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add event modal */}
      <RecordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ajouter un Événement"
        fields={[
          { name: 'title', label: 'Titre de l\'événement', required: true, placeholder: 'Ex: Réunion équipe' },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'dateEnd', label: 'Date de fin (optionnel)', type: 'date' },
          { name: 'type', label: 'Catégorie', type: 'select', options: ['Réunion', 'Formation', 'Déplacement', 'RDV Client', 'Autre'] },
          { name: 'color', label: 'Couleur', type: 'select', options: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'] },
          { name: 'notes', label: 'Remarques' },
        ]}
        initialData={{ date: selectedDay || '' }}
        onSave={(f) => {
          addRecord('planning', 'events', { ...f, createdBy: currentUser?.nom });
          setShowModal(false);
        }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════
   TIMESHEETS (TEMPS) VIEW
════════════════════════════════════════════ */
const TempsView = () => {
  const { data, currentUser, addRecord, updateRecord, userRole } = useStore();
  const [tab, setTab] = useState('my');
  const [showModal, setShowModal] = useState(false);

  const allTimesheets = data.hr?.timesheets || [];
  const myTimesheets = allTimesheets.filter(t => t.collaborateur === currentUser?.nom);
  const pendingAll = allTimesheets.filter(t => t.statut === 'En attente');
  const isManager = ['ADMIN', 'HR', 'SUPER_ADMIN'].includes(userRole);

  const myTotalH = myTimesheets.reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
  const myValidatedH = myTimesheets.filter(t => t.statut === 'Validé').reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
  const myPending = myTimesheets.filter(t => t.statut === 'En attente').length;

  // Weekly breakdown of MY hours
  const weeklyData = useMemo(() => {
    const map = {};
    myTimesheets.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const w = `S${Math.ceil(d.getDate() / 7)}`;
      map[w] = (map[w] || 0) + (parseFloat(t.heures) || 0);
    });
    return Object.entries(map).map(([week, h]) => ({ week, h }));
  }, [myTimesheets]);

  const maxH = Math.max(...weeklyData.map(w => w.h), 1);

  const handleValidate = (id, status) => updateRecord('hr', 'timesheets', id, { statut: status, validatedBy: currentUser?.nom, validatedAt: new Date().toISOString() });

  const statusColor = (s) => s === 'Validé' ? '#10B981' : s === 'Refusé' ? '#EF4444' : '#F59E0B';

  const renderTimesheetCard = (ts) => (
    <motion.div
      key={ts.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderLeft: `4px solid ${statusColor(ts.statut)}` }}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', fontSize: '0.8rem', flexShrink: 0 }}>
        {(ts.collaborateur || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ts.collaborateur}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{ts.date} · {ts.projet}</div>
        {ts.tache && <div style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: 2, fontStyle: 'italic' }}>{ts.tache}</div>}
      </div>
      <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--accent)', minWidth: 50, textAlign: 'center' }}>
        {ts.heures}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>h</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {chip(ts.statut, statusColor(ts.statut))}
        {ts.facturable && chip('Facturable', '#10B981')}
      </div>
      {isManager && ts.statut === 'En attente' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => handleValidate(ts.id, 'Refusé')} style={{ padding: '6px', borderRadius: '0.5rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer', display: 'flex' }}><XCircle size={16} /></button>
          <button onClick={() => handleValidate(ts.id, 'Validé')} style={{ padding: '6px', borderRadius: '0.5rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer', display: 'flex' }}><CheckCircle2 size={16} /></button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 200px),1fr))', gap: '1.25rem' }}>
        <KpiCard title="Mes Heures Totales" value={`${myTotalH}h`} icon={<Clock size={20} />} color="#3B82F6" trend={0} />
        <KpiCard title="Heures Validées" value={`${myValidatedH}h`} icon={<CheckCircle2 size={20} />} color="#10B981" trend={0} />
        <KpiCard title="En Attente" value={`${myPending} saisie${myPending > 1 ? 's' : ''}`} icon={<AlertCircle size={20} />} color="#F59E0B" trend={0} />
        {isManager && <KpiCard title="À Valider (Équipe)" value={`${pendingAll.length}`} icon={<Users size={20} />} color="#8B5CF6" trend={0} />}
      </div>

      {/* Mini weekly chart */}
      {weeklyData.length > 0 && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '1.25rem', fontSize: '0.9rem' }}>📈 Mes Heures par Semaine</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 80 }}>
            {weeklyData.map((w, i) => (
              <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: HOUR_COLORS[i % HOUR_COLORS.length] }}>{w.h}h</div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(w.h / maxH) * 64}px` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  style={{ width: '100%', background: `${HOUR_COLORS[i % HOUR_COLORS.length]}60`, borderRadius: '4px 4px 0 0', borderTop: `3px solid ${HOUR_COLORS[i % HOUR_COLORS.length]}` }}
                />
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{w.week}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Tabs
          tabs={[
            { id: 'my', label: 'Mes Saisies', icon: <ClipboardList size={14} /> },
            ...(isManager ? [{ id: 'team', label: `Équipe (${pendingAll.length})`, icon: <Users size={14} /> }] : []),
          ]}
          active={tab}
          onChange={setTab}
        />
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: '0.8rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
        >
          <Plus size={15} /> Saisir mes Heures
        </button>
      </div>

      {/* Timesheets list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence>
          {(tab === 'my' ? myTimesheets : allTimesheets).length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '1.5rem' }}>
              <Timer size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
                {tab === 'my' ? 'Aucune saisie. Cliquez sur "Saisir mes Heures" pour commencer !' : 'Toutes les saisies ont été traitées.'}
              </p>
            </motion.div>
          ) : (
            (tab === 'my' ? myTimesheets : allTimesheets).map(ts => renderTimesheetCard(ts))
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <RecordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Saisie de Temps"
        fields={[
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'projet', label: 'Projet', type: 'select', options: (data.projects?.projects || []).map(p => p.nom), required: true },
          { name: 'tache', label: 'Tâche effectuée', required: true, placeholder: 'Ex: Développement module planning' },
          { name: 'heures', label: 'Durée (heures)', type: 'number', required: true },
          { name: 'facturable', label: 'Facturable ?', type: 'select', options: ['Oui', 'Non'] },
          { name: 'commentaire', label: 'Commentaire' },
        ]}
        initialData={{ collaborateur: currentUser?.nom }}
        onSave={(f) => {
          addRecord('hr', 'timesheets', { ...f, collaborateur: currentUser?.nom, statut: 'En attente', facturable: f.facturable === 'Oui' });
          setShowModal(false);
        }}
      />
    </div>
  );
};

/* ════════════════════════════════════════════
   MAIN MODULE — Planning & Temps
════════════════════════════════════════════ */
const PlanningTemps = ({ appId }) => {
  const [mainTab, setMainTab] = useState(appId === 'timesheets' ? 'temps' : 'planning');

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#3B82F6', marginBottom: '0.6rem' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#3B82F620', padding: '6px', borderRadius: '8px' }}>
              <Calendar size={18} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '2px' }}>IPC — Temps & Planning</span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Planning & Temps</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '1rem', fontWeight: 500 }}>
            Gérez votre calendrier, vos saisies d'heures et les validations de l'équipe.
          </p>
        </div>
      </div>

      {/* Tab switch */}
      <Tabs
        tabs={[
          { id: 'planning', label: 'Planning', icon: <Calendar size={15} /> },
          { id: 'temps', label: 'Feuilles de Temps', icon: <Clock size={15} /> },
        ]}
        active={mainTab}
        onChange={setMainTab}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
          transition={{ duration: 0.28 }}
        >
          {mainTab === 'planning' && <PlanningView />}
          {mainTab === 'temps' && <TempsView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PlanningTemps;
