import { VisitStatus } from '@/lib/registry';

const LABELS: Record<VisitStatus, string> = {
  scheduled: 'Booked',
  arrived: 'Waiting',
  in_progress: 'In progress',
  complete: 'Complete',
  missed: 'Missed',
  cancelled: 'Cancelled',
};

const STYLES: Record<VisitStatus, string> = {
  scheduled: 'bg-field text-muted',
  arrived: 'bg-brand-red/10 text-brand-red',
  in_progress: 'bg-brand-green/10 text-brand-green',
  complete: 'bg-field text-muted',
  missed: 'bg-brand-red/10 text-brand-red',
  cancelled: 'bg-field text-muted',
};

export default function VisitStatusChip({ status }: { status: VisitStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
