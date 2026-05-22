/**
 * useEmployees() — SSOT selector for the HR employees list.
 *
 * Returns a single, deduplicated array sourced from `data.hr.employees`
 * (canonical) with a fallback to the legacy flat `data.employees` array.
 *
 * Background: prior to 2026-05-22 different HR surfaces read from different
 * paths, causing visible drift between Onboarding, the main registry, and
 * the directory. This hook is the single API every HR consumer should use.
 *
 * Usage:
 *   import { useEmployees } from '@/store/selectors/useEmployees';
 *   const employees = useEmployees();
 */

import { useStore } from '../index';

export function useEmployees() {
  return useStore((state) => {
    const nested = state.data?.hr?.employees;
    const flat   = state.data?.employees;
    if (Array.isArray(nested) && nested.length > 0) return nested;
    if (Array.isArray(flat)   && flat.length > 0)   return flat;
    // Both empty / unset → return the canonical empty list (stable reference).
    return EMPTY_LIST;
  });
}

const EMPTY_LIST = Object.freeze([]);

/**
 * useEmployee(id) — fetch a single employee by id.
 */
export function useEmployee(id) {
  return useStore((state) => {
    const list = state.data?.hr?.employees || state.data?.employees || [];
    return list.find((e) => String(e.id) === String(id)) || null;
  });
}
