'use client';

import { useState, useEffect } from 'react';

const ORG_ID_KEY = 'bailbooks_org_id';

/**
 * Hook that returns the org_id from localStorage.
 * If localStorage is empty (e.g. after cache clear), auto-discovers
 * the existing org from the database and reconnects.
 */
export function useOrgId() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ORG_ID_KEY);
    if (stored) {
      setOrgId(stored);
      setLoading(false);
      return;
    }

    // Auto-discover existing org
    fetch('/api/books/org?discover=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.organizations && d.organizations.length > 0) {
          const found = d.organizations[0];
          localStorage.setItem(ORG_ID_KEY, found.id);
          setOrgId(found.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { orgId, loading };
}
