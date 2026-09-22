import FullScreenWallpaper from '@/components/login/wallpaper';
import LoginForm from '@/components/login/login-form';
import MinimalFooter from '@/components/minimal_footer';

export default function Home() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#b9f5d1]">
      <FullScreenWallpaper />
      <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-28 sm:px-6 sm:py-30">
        <LoginForm />
      </div>

      <MinimalFooter />
    </section>
  );
}
