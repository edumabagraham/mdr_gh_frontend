'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';

/**
 * Patient record — a stub for this slice.
 *
 * Slice 1 deliberately stops at name, registry number and status; the full
 * banner, diagnosis history and instruments belong to later slices.
 */
export default function PatientRecordPage() {
  const params = useParams<{ registryNo: string }>();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-6">
        <p className="font-mono text-xs text-muted">{params.registryNo}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Patient record</h1>
        <p className="mt-2 text-sm text-muted">
          The record view arrives with a later slice. This route exists so search results and
          dashboard rows have somewhere to open.
        </p>
      </div>
    </AppShell>
  );
}
