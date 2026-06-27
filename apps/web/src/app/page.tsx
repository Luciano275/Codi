import FullScreenWallpaper from '@/components/login/wallpaper';
import LoginForm from '@/components/login/login-form';
import MinimalFooter from '@/components/minimal_footer';

export default function Home() {
  return (
    <section className="min-h-screen relative bg-[#0f0f1a]">
      <FullScreenWallpaper />
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <LoginForm />
      </div>

      <MinimalFooter />
    </section>
  );
}
