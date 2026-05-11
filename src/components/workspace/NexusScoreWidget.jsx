import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, doc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useStore } from '../../store';
import { TrendingUp, TrendingDown, Minus, Award, Zap, Users, Activity } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = Math.ceil((((d - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function fmt(n) {
  if (n == null) return '—';
  return Math.round(n);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score ?? 0));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

function BarRow({ label, value, max = 100, color = 'var(--accent)' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 3, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function IndexBadge({ label, value, icon: Icon, color }) {
  const level = value >= 66 ? 'HIGH' : value >= 33 ? 'MED' : 'LOW';
  const bg = { HIGH: `${color}25`, MED: '#F59E0B20', LOW: '#6B728015' };
  const textColor = { HIGH: color, MED: '#F59E0B', LOW: 'var(--text-muted)' };
  return (
    <div style={{ padding: '0.6rem 0.8rem', borderRadius: '0.75rem', background: bg[level], display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
      <Icon size={16} color={textColor[level]} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: textColor[level] }}>{fmt(value)}</div>
      </div>
    </div>
  );
}

function Sparkline({ history }) {
  if (!history || history.length < 2) return null;
  const vals = history.map(h => h.nexusScore ?? 0);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals) || 1;
  const w = 140, h = 40;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - minV) / (maxV - minV)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  const Trend = last > prev ? TrendingUp : last < prev ? TrendingDown : Minus;
  const tColor = last > prev ? '#10B981' : last < prev ? '#EF4444' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
        {vals.map((v, i) => {
          const x = (i / (vals.length - 1)) * w;
          const y = h - ((v - minV) / (maxV - minV)) * (h - 4) - 2;
          return <circle key={i} cx={x} cy={y} r={2.5} fill="var(--accent)" />;
        })}
      </svg>
      <Trend size={14} color={tColor} />
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function Leaderboard({ dept, weekId, myUid }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!dept || !weekId) return;
    // Query evaluations for same dept + week, take top 5
    const q = query(
      collection(db, 'evaluations'),
      orderBy('nexusScore', 'desc'),
      limit(10)
    );
    getDocs(q).then(snap => {
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.department === dept && r.periodId === weekId)
        .slice(0, 5);
      setEntries(rows);
    }).catch(() => {});
  }, [dept, weekId]);

  if (entries.length === 0) return null;
  const medals = ['🥇', '🥈', '🥉', '4', '5'];

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Classement Département
      </div>
      {entries.map((e, i) => (
        <div key={e.id} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem',
          borderRadius: '0.5rem', marginBottom: '0.3rem',
          background: e.uid === myUid ? 'var(--accent)15' : 'transparent',
          border: e.uid === myUid ? '1px solid var(--accent)40' : '1px solid transparent',
        }}>
          <span style={{ width: 20, textAlign: 'center', fontSize: '0.85rem' }}>{medals[i]}</span>
          <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: e.uid === myUid ? 800 : 500, color: e.uid === myUid ? 'var(--accent)' : 'var(--text)' }}>
            {e.uid === myUid ? 'Vous' : (e.userName || 'Utilisateur')}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fmt(e.nexusScore)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

export default function NexusScoreWidget() {
  const uid = useStore(s => s.user?.uid || s.user?.id);
  const currentUser = useStore(s => s.user);
  const weekId = isoWeekId();

  const [myScore, setMyScore] = useState(null);
  const [teamStat, setTeamStat] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live user score
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'user_scores', uid, 'weeks', weekId);
    const unsub = onSnapshot(ref, snap => {
      setMyScore(snap.exists() ? snap.data() : null);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid, weekId]);

  // Team stat
  const dept = myScore?.department || currentUser?.department || currentUser?.departement;
  useEffect(() => {
    if (!dept) return;
    const ref = doc(db, 'team_stats', dept, 'weeks', weekId);
    const unsub = onSnapshot(ref, snap => {
      setTeamStat(snap.exists() ? snap.data() : null);
    }, () => {});
    return unsub;
  }, [dept, weekId]);

  // History (last 6 weeks)
  const loadHistory = useCallback(async () => {
    if (!uid) return;
    try {
      const q = query(collection(db, 'user_scores', uid, 'weeks'), orderBy('computedAt', 'desc'), limit(6));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => d.data()).reverse();
      setHistory(rows);
    } catch (_) {}
  }, [uid]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Activity size={28} color="var(--accent)" />
        </motion.div>
      </div>
    );
  }

  const score = myScore?.nexusScore ?? null;
  const pIndiv = myScore?.P_indiv ?? null;
  const pTeam = myScore?.P_team ?? null;
  const bonus = myScore?.B_bonus ?? null;
  const mule = myScore?.behavioral?.mule ?? null;
  const ghost = myScore?.behavioral?.ghost ?? null;
  const bridge = myScore?.behavioral?.bridge ?? null;
  const teamAvg = teamStat?.avgScore ?? null;
  const teamTop = teamStat?.topScore ?? null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900 }}>

      {/* ── Hero row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center' }}>
        {/* Ring */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <ScoreRing score={score} size={140} stroke={12} />
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{score != null ? fmt(score) : '—'}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nexus Score</div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>
            Semaine {weekId.split('-W')[1]} · {weekId.split('-W')[0]}
          </div>
          {score == null ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Aucun score calculé pour cette semaine. Les scores sont mis à jour chaque lundi.
            </div>
          ) : (
            <>
              <BarRow label="Performance Individuelle (P_indiv)" value={pIndiv} color="#6366F1" />
              <BarRow label="Performance Équipe (P_team)" value={pTeam} color="#8B5CF6" />
              <BarRow label="Bonus Synergie (B_bonus)" value={bonus} max={30} color="#10B981" />
            </>
          )}
        </div>
      </div>

      {/* ── Moi vs Mon Équipe ── */}
      <AnimatePresence>
        {(teamAvg != null || score != null) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--accent)" /> Moi vs Mon Équipe
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
              {[
                { label: 'Mon Score', val: score, color: 'var(--accent)' },
                { label: 'Moyenne Équipe', val: teamAvg, color: '#8B5CF6' },
                { label: 'Top Équipe', val: teamTop, color: '#F59E0B' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ padding: '1rem', borderRadius: '0.75rem', background: `${color}12`, border: `1px solid ${color}30` }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{val != null ? fmt(val) : '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
                </div>
              ))}
            </div>
            {teamAvg != null && score != null && (
              <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {score >= teamAvg
                  ? `+${fmt(score - teamAvg)} pts au-dessus de la moyenne`
                  : `${fmt(teamAvg - score)} pts en dessous de la moyenne`}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Behavioural Indices ── */}
      <AnimatePresence>
        {(mule != null || ghost != null || bridge != null) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="#F59E0B" /> Indices Comportementaux
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <IndexBadge label="Indice Mule" value={mule} icon={Activity} color="#EF4444" />
              <IndexBadge label="Indice Ghost" value={ghost} icon={Minus} color="#6B7280" />
              <IndexBadge label="Indice Bridge" value={bridge} icon={Users} color="#6366F1" />
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Mule = charge relative · Ghost = inactivité · Bridge = synergies cross-département
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Historique + Leaderboard ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
        {/* Trend */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={15} color="var(--accent)" /> Tendance (6 semaines)
          </div>
          {history.length >= 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Sparkline history={history} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {history.map((h, i) => (
                  <span key={i}>W{(h.periodId || '').split('-W')[1] || i + 1}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Données insuffisantes (min. 2 semaines)</div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={15} color="#F59E0B" /> Top Département
          </div>
          <Leaderboard dept={dept} weekId={weekId} myUid={uid} />
          {!dept && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Département non défini dans votre profil.</div>}
        </div>
      </div>

    </motion.div>
  );
}
