import { redirect } from 'next/navigation';

/** The portal has no marketing page: the root is the sign-in screen. */
export default function Home() {
  redirect('/login');
}
