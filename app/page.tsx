'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import Axios from 'axios';
import { Dashboard, getDashboard } from '@/lib/registry';
import AppShell from '@/components/AppShell';
import DashboardSection from '@/components/DashboardSection';
import VisitStatusChip from '@/components/VisitStatusChip';

/**
 * The clinician dashboard — the screen after login.
 *
 * Organised around today's clinic rather than "my patients": patients here are
 * seen by whoever is in clinic that day. The personal sections are shortcuts,
 * never permission boundaries.
 */
export default function DashboardPage() {
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<Dashboard>('dashboard', getDashboard, {
    revalidateOnFocus: false,
  });

  const unauthenticated = Axios.isAxiosError(error) && error.response?.status === 401;

  useEffect(() => {
    if (unauthenticated) {
      router.replace('/login');
    }
  }, [unauthenticated, router]);

  const nothingAtAll =
    data !== undefined &&
    data.todays_clinic.count === 0 &&
    data.unfinished_work.count === 0 &&
    data.overdue_followup.count === 0 &&
    data.recently_seen.count === 0;

  return (
    <AppShell>
      {isLoading && <DashboardSkeleton />}

      {!isLoading && error && !unauthenticated && (
        <div className="max-w-xl rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">The dashboard could not be loaded</h2>
          <p className="mt-1 text-sm text-muted">
            {Axios.isAxiosError(error) && error.response
              ? `The server answered with status ${error.response.status}.`
              : 'The registry could not be reached. Cached patient search still works.'}
          </p>
          <button
            onClick={() => mutate()}
            className="mt-4 rounded-md border border-line px-3 py-2 text-sm font-medium
                       transition hover:border-brand-red hover:text-brand-red"
          >
            Try again
          </button>
        </div>
      )}

      {data && nothingAtAll && (
        <div className="max-w-xl rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Nothing scheduled, nothing outstanding</h2>
          <p className="mt-1 text-sm text-muted">
            No clinic is booked for today and no work is waiting. Search above to open an
            existing record, or register a patient.
          </p>
          <Link
            href="/patients/new"
            className="mt-4 inline-block rounded-md bg-brand-red px-4 py-2 text-sm font-semibold
                       text-white transition hover:bg-brand-red-dark"
          >
            Register a patient
          </Link>
        </div>
      )}

      {data && !nothingAtAll && (
        <div className="grid gap-4 lg:grid-cols-3">
          <DashboardSection
            title="Today's clinic"
            count={data.todays_clinic.count}
            detail={`${data.todays_clinic.waiting} waiting`}
            emptyNote="Nobody is booked for today."
            className="lg:col-span-2"
          >
            {data.todays_clinic.items.map((item) => (
              <div key={item.visit_id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/patients/${item.patient.registry_no}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.patient.name}
                  </Link>
                  <p className="text-xs text-muted">
                    <span className="font-mono">{item.patient.registry_no}</span>
                    {item.patient.age !== undefined && ` · ${item.patient.age}`}
                    {item.patient.sex && ` · ${item.patient.sex}`}
                    {` · ${item.type}`}
                  </p>
                </div>
                {item.waiting_minutes !== null && item.status === 'arrived' && (
                  <span className="shrink-0 text-xs text-muted">
                    waiting {item.waiting_minutes} min
                  </span>
                )}
                <VisitStatusChip status={item.status} />
              </div>
            ))}
          </DashboardSection>

          <DashboardSection
            title="My unfinished work"
            count={data.unfinished_work.count}
            emptyNote="Nothing started and left open."
          >
            {data.unfinished_work.items.map((item) => (
              <div key={item.administration_id} className="px-4 py-2.5">
                <Link
                  href={`/patients/${item.patient.registry_no}`}
                  className="text-sm font-medium hover:underline"
                >
                  {item.patient.name}
                </Link>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  {item.instrument}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      item.sync_state === 'failed'
                        ? 'bg-brand-red/10 text-brand-red'
                        : item.sync_state === 'synced'
                          ? 'bg-brand-green/10 text-brand-green'
                          : 'bg-field text-muted'
                    }`}
                  >
                    {item.sync_state === 'pending' ? 'saved locally' : item.sync_state}
                  </span>
                </p>
              </div>
            ))}
          </DashboardSection>

          <DashboardSection
            title="Overdue follow-up"
            count={data.overdue_followup.count}
            emptyNote="No patient is past a scheduled visit."
            className="lg:col-span-2"
          >
            {data.overdue_followup.items.map((item) => (
              <div key={item.patient.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/patients/${item.patient.registry_no}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.patient.name}
                  </Link>
                  <p className="text-xs text-muted">
                    due {item.scheduled_for}
                    {item.date_last_seen && ` · last seen ${item.date_last_seen}`}
                    {item.contact_attempts > 0 && ` · ${item.contact_attempts} contact attempts`}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-brand-red">
                  {item.days_overdue} days
                </span>
              </div>
            ))}
          </DashboardSection>

          <DashboardSection
            title="Recently seen by me"
            count={data.recently_seen.count}
            emptyNote="No completed visits yet."
          >
            {data.recently_seen.items.map((item) => (
              <div key={`${item.patient.id}-${item.completed_at}`} className="px-4 py-2.5">
                <Link
                  href={`/patients/${item.patient.registry_no}`}
                  className="text-sm font-medium hover:underline"
                >
                  {item.patient.name}
                </Link>
                <p className="text-xs text-muted">
                  {new Date(item.completed_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </DashboardSection>
        </div>
      )}
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-busy>
      {[
        'lg:col-span-2',
        '',
        'lg:col-span-2',
        '',
      ].map((span, index) => (
        <div key={index} className={`rounded-xl border border-line bg-surface ${span}`}>
          <div className="border-b border-line px-4 py-3">
            <div className="h-4 w-40 animate-pulse rounded bg-field" />
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="h-3 w-full animate-pulse rounded bg-field" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-field" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-field" />
          </div>
        </div>
      ))}
    </div>
  );
}
