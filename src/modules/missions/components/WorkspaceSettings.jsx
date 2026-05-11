/**
 * WorkspaceSettings — Member & visibility management for a workspace
 *
 * Panels:
 *   Members   — list, invite by email, change role (ADMIN only), remove
 *   Visibility — per-board visibility toggle workspace-wide vs private
 *
 * Access control is enforced both in this UI (buttons disabled for non-admins)
 * and server-side via Firestore security rules (memberRoles map).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, Crown, Eye, Edit3,
  UserPlus, Trash2, Search, Check, X,
  ChevronDown, Lock, Globe,
} from 'lucide-react';
import { MissionsFS } from '../services/missions.firestore';
import { useWorkspaceAuth } from '../hooks/useWorkspaceAuth';
import { useStore } from '../../../store';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'ADMIN',  label: 'Admin',   icon: <Crown size={12} />,  color: '#F59E0B', desc: 'Gestion complète du workspace' },
  { value: 'MEMBER', label: 'Membre',  icon: <Edit3 size={12} />,  color: '#8B5CF6', desc: 'Lecture et écriture des cartes' },
  { value: 'VIEWER', label: 'Lecteur', icon: <Eye size={12} />,    color: '#64748B', desc: 'Lecture seule' },
];

const roleOf = (value) => ROLES.find(r => r.value === value) || ROLES[1];

// ─────────────────────────────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const r = roleOf(role);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 8px', borderRadius: '999px',
      background: `${r.color}18`, color: r.color,
      fontSize: '0.7rem', fontWeight: 700,
    }}>
      {r.icon} {r.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROLE SELECTOR (dropdown)
// ─────────────────────────────────────────────────────────────────

function RoleSelector({ current, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const r = roleOf(current);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 10px', borderRadius: '999px', border: 'none',
          background: `${r.color}18`, color: r.color,
          fontSize: '0.7rem', fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {r.icon} {r.label} {!disabled && <ChevronDown size={10} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 100,
                background: 'white', borderRadius: '0.75rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                minWidth: '200px', overflow: 'hidden',
              }}
            >
              {ROLES.map(role => (
                <button
                  key={role.value}
                  onClick={() => { onChange(role.value); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    width: '100%', padding: '0.65rem 0.875rem',
                    background: role.value === current ? `${role.color}10` : 'white',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid #F8FAFC',
                  }}
                >
                  <span style={{ color: role.color }}>{role.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                      {role.label}
                      {role.value === current && <Check size={10} style={{ marginLeft: '4px', color: role.color }} />}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{role.desc}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MEMBER ROW
// ─────────────────────────────────────────────────────────────────

function MemberRow({ member, currentUid, isAdmin, workspaceId, onRoleChange, onRemove }) {
  const isSelf    = member.uid === currentUid;
  const canChange = isAdmin && !isSelf;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.625rem 0',
      borderBottom: '1px solid #F8FAFC',
    }}>
      {/* Avatar */}
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
        background: `hsl(${member.uid.charCodeAt(0) * 37 % 360}, 55%, 60%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 800, color: 'white',
      }}>
        {(member.nom || member.uid).slice(0, 2).toUpperCase()}
      </div>

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {member.nom || member.uid.slice(0, 12)}
          {isSelf && (
            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>(vous)</span>
          )}
        </div>
        {member.email && (
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.email}
          </div>
        )}
      </div>

      {/* Role selector */}
      <RoleSelector
        current={member.role}
        onChange={role => onRoleChange(member.uid, role)}
        disabled={!canChange}
      />

      {/* Remove */}
      {canChange && (
        <button
          onClick={() => onRemove(member.uid)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#CBD5E1', padding: '4px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
          title="Retirer du workspace"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// INVITE PANEL
// ─────────────────────────────────────────────────────────────────

function InvitePanel({ workspaceId, existingUids, onClose }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [inviting, setInviting] = useState(null);
  const [invited, setInvited]   = useState(new Set());
  const [role, setRole]         = useState('MEMBER');

  const search = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await MissionsFS.searchUsersByEmail(q);
      setResults(res.filter(u => !existingUids.includes(u.uid)));
    } finally {
      setLoading(false);
    }
  }, [existingUids]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  const invite = async (user) => {
    setInviting(user.uid);
    try {
      await MissionsFS.addWorkspaceMember(workspaceId, user.uid, role);
      setInvited(s => new Set([...s, user.uid]));
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setInviting(null);
    }
  };

  return (
    <div style={{
      background: '#F8FAFC', borderRadius: '0.875rem',
      border: '1.5px solid #8B5CF6', padding: '1rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>
          Inviter un collaborateur
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
          <X size={14} />
        </button>
      </div>

      {/* Role for new member */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Rôle :</span>
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            style={{
              padding: '3px 10px', borderRadius: '999px', border: 'none',
              background: role === r.value ? `${r.color}20` : 'transparent',
              color: role === r.value ? r.color : '#94A3B8',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher par email…"
          style={{
            width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem',
            borderRadius: '0.5rem', border: '1px solid #E2E8F0',
            fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '0.75rem', color: '#94A3B8', fontSize: '0.8rem' }}>
          Recherche…
        </div>
      )}
      {results.map(user => (
        <div key={user.uid} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
          background: 'white', border: '1px solid #F1F5F9',
          marginBottom: '0.35rem',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: `hsl(${user.uid.charCodeAt(0) * 37 % 360}, 55%, 60%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800, color: 'white',
          }}>
            {user.nom.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{user.nom}</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{user.email}</div>
          </div>
          {invited.has(user.uid) ? (
            <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Check size={11} /> Invité
            </span>
          ) : (
            <button
              onClick={() => invite(user)}
              disabled={inviting === user.uid}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '0.5rem',
                background: '#8B5CF6', color: 'white', border: 'none',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                opacity: inviting === user.uid ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <UserPlus size={11} /> Inviter
            </button>
          )}
        </div>
      ))}
      {!loading && query.length >= 3 && results.length === 0 && (
        <div style={{ textAlign: 'center', color: '#CBD5E1', fontSize: '0.8rem', padding: '0.5rem' }}>
          Aucun utilisateur trouvé pour "{query}"
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WORKSPACE SETTINGS — root
// ─────────────────────────────────────────────────────────────────

const WorkspaceSettings = ({ workspaceId, onClose }) => {
  const uid        = useStore(s => s.user?.uid || s.user?.id);
  const { isAdmin } = useWorkspaceAuth(workspaceId);

  const [members, setMembers]     = useState([]);
  const [inviting, setInviting]   = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = MissionsFS.subscribeWorkspaceMembers(workspaceId, setMembers);
    return unsub;
  }, [workspaceId]);

  const handleRoleChange = async (targetUid, newRole) => {
    setSaving(true);
    try {
      await MissionsFS.updateWorkspaceMemberRole(workspaceId, targetUid, newRole);
      showToast('Rôle mis à jour.');
    } catch (e) {
      showToast(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (targetUid) => {
    if (!window.confirm('Retirer ce membre du workspace ?')) return;
    setSaving(true);
    try {
      await MissionsFS.removeWorkspaceMember(workspaceId, targetUid);
      showToast('Membre retiré.');
    } catch (e) {
      showToast(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const existingUids = members.map(m => m.uid);
  const adminCount   = members.filter(m => m.role === 'ADMIN').length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.25rem 1.25rem 0',
        marginBottom: '1rem',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '0.75rem',
          background: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={18} color="#8B5CF6" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
            Paramètres du Workspace
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            {members.length} membre{members.length !== 1 ? 's' : ''}
            {!isAdmin && ' — lecture seule'}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #F1F5F9',
        padding: '0 1.25rem',
      }}>
        {[
          { key: 'members',    label: 'Membres',     icon: <Users size={13} /> },
          { key: 'security',   label: 'Sécurité',    icon: <Shield size={13} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '0.6rem 0.875rem', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              color: activeTab === tab.key ? '#8B5CF6' : '#64748B',
              borderBottom: activeTab === tab.key ? '2px solid #8B5CF6' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>

        {/* ── MEMBERS TAB ──────────────────────────────── */}
        {activeTab === 'members' && (
          <>
            {/* Invite panel */}
            <AnimatePresence>
              {inviting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <InvitePanel
                    workspaceId={workspaceId}
                    existingUids={existingUids}
                    onClose={() => setInviting(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invite button */}
            {isAdmin && !inviting && (
              <button
                onClick={() => setInviting(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '0.45rem 0.875rem', borderRadius: '0.5rem',
                  background: '#8B5CF6', color: 'white', border: 'none',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  marginBottom: '0.875rem',
                }}
              >
                <UserPlus size={13} /> Inviter un collaborateur
              </button>
            )}

            {/* Member list */}
            <div>
              {members.map(m => (
                <MemberRow
                  key={m.uid}
                  member={m}
                  currentUid={uid}
                  isAdmin={isAdmin}
                  workspaceId={workspaceId}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))}
              {members.length === 0 && (
                <div style={{ textAlign: 'center', color: '#CBD5E1', padding: '1.5rem', fontSize: '0.8rem' }}>
                  Aucun membre
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SECURITY TAB ──────────────────────────── */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Role definitions */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Niveaux d'accès
              </div>
              {ROLES.map(r => (
                <div key={r.value} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                  border: '1px solid #F1F5F9', marginBottom: '0.35rem',
                }}>
                  <span style={{ color: r.color }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{r.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{r.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#CBD5E1' }}>
                    {members.filter(m => m.role === r.value).length} membre{members.filter(m => m.role === r.value).length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Security status */}
            <div style={{
              background: adminCount >= 1 ? '#D1FAE510' : '#FEE2E210',
              border: `1px solid ${adminCount >= 1 ? '#10B98130' : '#EF444430'}`,
              borderRadius: '0.75rem', padding: '0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                {adminCount >= 1
                  ? <Shield size={14} color="#10B981" />
                  : <Shield size={14} color="#EF4444" />}
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: adminCount >= 1 ? '#10B981' : '#EF4444' }}>
                  {adminCount >= 1 ? 'Workspace sécurisé' : 'Aucun administrateur'}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0 }}>
                {adminCount >= 1
                  ? `${adminCount} admin${adminCount > 1 ? 's' : ''} actif${adminCount > 1 ? 's' : ''}. Les règles Firestore bloquent tout accès non-membre.`
                  : 'Attention : ce workspace n\'a aucun administrateur. Assignez un rôle ADMIN.'
                }
              </p>
            </div>

            {/* Firestore rules reminder */}
            <div style={{
              background: '#F8FAFC', borderRadius: '0.75rem',
              border: '1px solid #E2E8F0', padding: '0.875rem',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Protection Firestore
              </div>
              {[
                { icon: <Lock size={11} />,  label: 'Workspaces', desc: 'Membres seulement (memberRoles map)' },
                { icon: <Lock size={11} />,  label: 'Boards / Listes / Cartes', desc: 'Héritage du workspace — VIEWER bloqué en écriture' },
                { icon: <Lock size={11} />,  label: 'Activity logs', desc: 'Lecture seule — écriture Cloud Functions uniquement' },
                { icon: <Lock size={11} />,  label: 'Butler rules', desc: 'ADMIN uniquement' },
                { icon: <Globe size={11} />, label: 'Rapports hebdo', desc: 'Manager / SuperAdmin uniquement' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                  marginBottom: '0.3rem',
                }}>
                  <span style={{ color: '#8B5CF6', marginTop: '2px', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    <strong style={{ color: '#1E293B' }}>{item.label}</strong> — {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute', bottom: '1rem', left: '50%',
              transform: 'translateX(-50%)',
              background: '#1E293B', color: 'white',
              padding: '0.4rem 1rem', borderRadius: '0.625rem',
              fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSettings;
