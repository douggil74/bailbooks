'use client';

import { createContext, useContext } from 'react';

const OrgContext = createContext<string | null>(null);

export function OrgProvider({ orgId, children }: { orgId: string | null; children: React.ReactNode }) {
  return <OrgContext.Provider value={orgId}>{children}</OrgContext.Provider>;
}

/**
 * Returns the org_id resolved by BooksShell.
 * Guaranteed to be available (non-null) when BooksShell has found an org.
 * Falls back to localStorage if context is not available.
 */
export function useOrg(): string | null {
  const ctx = useContext(OrgContext);
  if (ctx) return ctx;
  // Fallback for any edge case where context isn't available
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bailbooks_org_id');
  }
  return null;
}
