/**
 * useWorkspaceAuth — RBAC helper for the active workspace
 *
 * Returns the current user's role and convenience booleans derived from
 * the workspace's memberRoles map.
 *
 * Roles:
 *   ADMIN  — full control (manage members, delete boards, butler rules)
 *   MEMBER — read + write cards/lists/comments/attachments
 *   VIEWER — read-only
 */
import { useMemo } from 'react';
import { useMissionsStore } from '../store/useMissionsStore';
import { useStore } from '../../../store';

export function useWorkspaceAuth(workspaceId) {
  const { user }     = useStore();
  const uid          = user?.uid || user?.id;
  const workspaces   = useMissionsStore(s => s.workspaces);

  return useMemo(() => {
    if (!uid || !workspaceId) {
      return { role: 'NONE', isAdmin: false, canWrite: false, canRead: false, isMember: false };
    }

    const ws = workspaces.find(w => w.id === workspaceId);
    if (!ws) {
      return { role: 'NONE', isAdmin: false, canWrite: false, canRead: false, isMember: false };
    }

    // memberRoles map: { uid: 'ADMIN'|'MEMBER'|'VIEWER' }
    const role = ws.memberRoles?.[uid]
      || ws.members?.find(m => m.uid === uid)?.role  // fallback for old docs
      || 'NONE';

    return {
      role,
      isMember:  role !== 'NONE',
      canRead:   role !== 'NONE',
      canWrite:  role === 'ADMIN' || role === 'MEMBER',
      isAdmin:   role === 'ADMIN',
    };
  }, [uid, workspaceId, workspaces]);
}
