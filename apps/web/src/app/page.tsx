import FullScreenWallpaper from '@/components/login/wallpaper';
import LoginForm from '@/components/login/login-form';
import MinimalFooter from '@/components/minimal_footer';

export default function Home() {
  return (
    <section className="relative min-h-[100dvh] overflow-x-hidden bg-[#b9f5d1]">
      <FullScreenWallpaper />
      <main className="relative z-20 flex min-h-[100dvh] items-center justify-center px-4 py-[clamp(5.25rem,11vh,7.5rem)] sm:px-6">
        <LoginForm />
      </main>

      <MinimalFooter />
    </section>
  );
}
