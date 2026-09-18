import { redirect } from 'next/navigation';

/** The dashboard moved to the root once it became the clinical home screen. */
export default function LegacyDashboardPage() {
  redirect('/');
}
