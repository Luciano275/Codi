import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileForm from './profile-form';

export default async function ProfilePage() {
  const user = await auth();
  if (!user) redirect('/');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-super-pandora text-2xl text-gray-900">Mi perfil</h1>
        <p className="font-simply-olive mt-0.5 text-sm text-gray-500">
          Gestioná tu información personal
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
