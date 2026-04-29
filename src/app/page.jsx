import { redirect } from 'next/navigation';

// Direct entry — no login required.
// Splash screen + teacher dashboard load right after this redirect.
export default function HomePage() {
  redirect('/teacher');
}
