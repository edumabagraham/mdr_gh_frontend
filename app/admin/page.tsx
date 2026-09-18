'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Axios from 'axios';
import { getUser, Role } from '@/lib/auth';
import {
  Invitation,
  inviteUser,
  listInvitations,
  remindInvitation,
  revokeInvitation,
  ROLE_LABELS,
} from '@/lib/admin';
import { toFormFailure } from '@/lib/form-errors';
import AppShell from '@/components/AppShell';
import FormField from '@/components/FormField';
import SelectField from '@/components/SelectField';
import PrimaryButton from '@/components/PrimaryButton';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-field text-muted',
  accepted: 'bg-brand-green/10 text-brand-green',
  revoked: 'bg-brand-red/10 text-brand-red',
  expired: 'bg-brand-red/10 text-brand-red',
};

/**
 * Account administration.
 *
 * Built on opposite principles to the clinician dashboard: an admin opens this
 * perhaps monthly, having forgotten how it works, to do something consequential.
 * Full labels, plain language, no icons standing in for words.
 *
 * No patient data appears here, by design — admins hold no clinical permissions.
 */
export default function AdminPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('clinician');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: invitations, error, isLoading, mutate } = useSWR<Invitation[]>(
    'invitations',
    () => listInvitations(),
    { revalidateOnFocus: false },
  );

  // Anyone who is not an admin has no business here, and would only collect
  // 403s from every request this page makes.
  const { data: me, error: meError } = useSWR('user', getUser, { revalidateOnFocus: false });

  useEffect(() => {
    if (me && me.role !== 'admin') {
      router.replace('/');
    }

    if (Axios.isAxiosError(meError) && meError.response?.status === 401) {
      router.replace('/login');
    }
  }, [me, meError, router]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const invitation = await inviteUser(email, role as Role);
      setNotice(`Invitation emailed to ${invitation.email}. It expires on ${
        new Date(invitation.expires_at).toLocaleDateString()
      }.`);
      setEmail('');
      mutate();
    } catch (failure) {
      const problem = toFormFailure(failure);
      setErrors(problem.errors);
      setStatus(problem.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemind = async (invitation: Invitation) => {
    setStatus(null);
    setNotice(null);

    try {
      const updated = await remindInvitation(invitation.id);
      setNotice(
        `A fresh invitation has been emailed to ${invitation.email}. The previous link no longer works; the new one expires on ${
          new Date(updated.expires_at).toLocaleDateString()
        }.`,
      );
      mutate();
    } catch (failure) {
      setStatus(toFormFailure(failure).message);
    }
  };

  const handleRevoke = async (invitation: Invitation) => {
    setStatus(null);
    setNotice(null);

    try {
      await revokeInvitation(invitation.id);
      setNotice(`The invitation to ${invitation.email} has been withdrawn.`);
      mutate();
    } catch (failure) {
      setStatus(toFormFailure(failure).message);
    }
  };

  return (
    <AppShell clinicalTools={false}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Account administration</h1>
          <p className="mt-1 text-sm text-muted">
            Accounts are created by invitation only. Everything on this page is written to the audit
            log, including who invited whom.
          </p>
        </div>

        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Invite a colleague</h2>
          <p className="mt-1 text-sm text-muted">
            They will receive a link that expires in seven days. The role you choose here is the one
            they get — they cannot change it when they accept.
          </p>

          <form onSubmit={handleInvite} className="mt-5 grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <FormField
              id="email"
              label="Email address"
              type="email"
              required
              value={email}
              onChange={setEmail}
              error={errors.email?.[0]}
            />
            <SelectField
              id="role"
              label="Role"
              required
              value={role}
              onChange={setRole}
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
              error={errors.role?.[0]}
            />
            <div className="sm:w-40">
              <PrimaryButton disabled={submitting}>
                {submitting ? 'Sending…' : 'Send invitation'}
              </PrimaryButton>
            </div>
          </form>

          {notice && <p className="mt-4 text-sm text-brand-green">{notice}</p>}
          {status && <p className="mt-4 text-sm text-brand-red">{status}</p>}
        </section>

        <section className="rounded-xl border border-line bg-surface">
          <header className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold">Invitations</h2>
          </header>

          {isLoading && <p className="px-6 py-4 text-sm text-muted">Loading…</p>}

          {error && (
            <p className="px-6 py-4 text-sm text-brand-red">
              The invitation list could not be loaded.
            </p>
          )}

          {invitations?.length === 0 && (
            <p className="px-6 py-4 text-sm text-muted">
              Nobody has been invited yet. Appoint a second administrator before go-live — one
              administrator who is on leave when access needs removing is a real problem.
            </p>
          )}

          {invitations?.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{invitation.email}</p>
                <p className="text-xs text-muted">
                  {ROLE_LABELS[invitation.role]}
                  {invitation.invited_by && ` · invited by ${invitation.invited_by}`}
                  {` · expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  STATUS_STYLES[invitation.status] ?? 'bg-field text-muted'
                }`}
              >
                {invitation.status}
              </span>

              {invitation.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleRemind(invitation)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium
                               transition hover:border-brand-green hover:text-brand-green"
                  >
                    Send reminder
                  </button>
                  <button
                    onClick={() => handleRevoke(invitation)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium
                               transition hover:border-brand-red hover:text-brand-red"
                  >
                    Withdraw
                  </button>
                </>
              )}
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
