import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeachingLayout({ children }: { children: React.ReactNode }) {
  const user = await auth();
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) redirect('/dashboard');
  return children;
}
