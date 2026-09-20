'use client';

import { memo, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  BookOpenCheck,
  CircleGauge,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Code2,
  Gem,
  Grid2X2,
  HelpCircle,
  LayoutGrid,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  X,
} from '@/components/ui/Icon';
import type {
  AdminReward,
  AdminRewardRedemptionsPage,
  RecentReward,
  RewardsStoreData,
  StoreReward,
} from '@codi/types';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { DynamicCodiMascot } from '@/components/mascot/DynamicCodiMascot';
import diamondChestImage from '@/assets/diamonds_chest.webp';
import shopImage from '@/assets/shop.webp';
import shopWallpaperImage from '@/assets/shop_wallpaper.webp';
import { redeemReward } from './actions';
import { RewardIllustration } from './store-illustrations';

const RewardAdminPanel = dynamic(() =>
  import('./reward-admin-panel').then((module) => module.RewardAdminPanel),
);
const StoreDialog = dynamic(() => import('./store-dialog').then((module) => module.StoreDialog));
const RedeemCelebration = dynamic(() =>
  import('./redeem-celebration').then((module) => module.RedeemCelebration),
);
const RewardRedemptionsAdminPanel = dynamic(() =>
  import('./reward-redemptions-admin-panel').then((module) => module.RewardRedemptionsAdminPanel),
);

const categories = [
  ['ALL', 'Todas'],
  ['EXAMS', 'Exámenes'],
  ['PRACTICE', 'Práctica'],
  ['ADVANTAGES', 'Ventajas'],
  ['SPECIALS', 'Especiales'],
] as const;

type Category = (typeof categories)[number][0];
type StoreTab = 'STORE' | 'MY_REWARDS' | 'ADMIN';

const rewardCategories = {
  EXAMS: 'Exámenes',
  PRACTICE: 'Práctica',
  ADVANTAGES: 'Ventajas',
  SPECIALS: 'Especiales',
} as const;

const categoryIcons = {
  ALL: Grid2X2,
  EXAMS: BookOpenCheck,
  PRACTICE: Code2,
  ADVANTAGES: CircleGauge,
  SPECIALS: ClipboardCheck,
} as const;

const rewardThemes = {
  exam: {
    card: 'border-castillo-200 from-castillo-50 via-white to-desierto-50',
    tag: 'bg-castillo-100 text-desierto-700',
    price: 'border-castillo-200 bg-castillo-100 text-desierto-800',
    action: 'from-desierto-500 to-castillo-500',
  },
  hint: {
    card: 'border-bosque-200 from-bosque-50 via-white to-fuchsia-50',
    tag: 'bg-bosque-100 text-bosque-700',
    price: 'border-bosque-200 bg-bosque-100 text-bosque-800',
    action: 'from-bosque-500 to-bosque-400',
  },
  'double-xp': {
    card: 'border-lagos-200 from-lagos-50 via-white to-valle-50',
    tag: 'bg-lagos-100 text-lagos-700',
    price: 'border-lagos-200 bg-lagos-100 text-lagos-800',
    action: 'from-lagos-500 to-valle-500',
  },
} as const;

function useRemainingTime(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  if (!expiresAt) return null;
  const milliseconds = new Date(expiresAt).getTime() - now;
  if (milliseconds <= 0) return null;
  const minutes = Math.ceil(milliseconds / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m restantes`;
}

function ActiveDoubleXpDuration({ expiresAt }: { expiresAt: string | null | undefined }) {
  const remaining = useRemainingTime(expiresAt);
  return (
    <p className="mb-3 flex items-center gap-1.5 font-simply-olive text-xs font-bold text-lagos-700">
      <Clock3 className="h-3.5 w-3.5" />
      {remaining ? `2× XP activo · ${remaining}` : 'Duración: 24 horas'}
    </p>
  );
}

const RewardCard = memo(function RewardCard({
  reward,
  onRedeem,
}: {
  reward: StoreReward;
  onRedeem: (reward: StoreReward) => void;
}) {
  const category = rewardCategories[reward.category];
  const theme = rewardThemes[reward.visual];
  const acquired = reward.acquiredTrimesters?.length ?? 0;
  const buttonLabel =
    reward.status === 'ACTIVE'
      ? 'Activo'
      : reward.status === 'INSUFFICIENT_GEMS'
        ? `Te faltan ${reward.missingGems} gemas`
        : reward.status === 'ACQUIRED' && reward.type !== 'EXAM_BONUS_POINT'
          ? 'Adquirida'
          : 'Canjear';
  const canOpen =
    reward.status === 'AVAILABLE' ||
    (reward.type === 'EXAM_BONUS_POINT' && reward.status === 'ACQUIRED' && acquired < 3);
  const actionClass = canOpen
    ? `bg-linear-to-r ${theme.action} text-white`
    : 'border border-gray-700 bg-gray-900 text-white';
  const cardStyle = {
    background: `linear-gradient(160deg, color-mix(in srgb, ${reward.color} 13%, white), white 48%, color-mix(in srgb, ${reward.color} 7%, white))`,
    borderColor: `color-mix(in srgb, ${reward.color} 25%, white)`,
  };

  return (
    <article
      className="deferred-card relative flex min-h-[410px] flex-col overflow-hidden rounded-[1.8rem] border-2 p-4 shadow-md transition-transform duration-200 hover:-translate-y-1"
      style={cardStyle}
    >
      <RewardIllustration
        color={reward.color}
        icon={reward.icon}
        imageUrl={reward.imageUrl}
        name={reward.name}
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-2.5 py-1 font-simply-olive text-[10px] font-bold ${theme.tag}`}
        >
          {category}
        </span>
        {reward.status === 'ACTIVE' && (
          <span className="flex items-center gap-1 rounded-full bg-valle-50 px-2.5 py-1 font-simply-olive text-[10px] font-bold text-valle-700">
            <Clock3 className="h-3 w-3" /> Activo
          </span>
        )}
      </div>
      <h2 className="mt-3 font-super-pandora text-xl text-gray-900">{reward.name}</h2>
      <p className="mt-1 font-simply-olive text-sm leading-6 text-gray-500">{reward.description}</p>
      <div className="mt-auto pt-4">
        {reward.type === 'DOUBLE_XP' && (
          <ActiveDoubleXpDuration expiresAt={reward.entitlement?.expiresAt} />
        )}
        {reward.type === 'EXAM_BONUS_POINT' && acquired > 0 && (
          <p className="mb-3 font-simply-olive text-xs font-bold text-desierto-700">
            {acquired}/3 trimestres adquiridos
          </p>
        )}
        {reward.type === 'SMART_HINT' && reward.status === 'ACQUIRED' && (
          <p className="mb-3 font-simply-olive text-xs font-bold text-bosque-700">
            Pista disponible · se consume al utilizarla
          </p>
        )}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 ${theme.price}`}
        >
          <span className="flex items-center gap-1.5 font-candy-beans text-xl">
            <Gem className="h-4 w-4 fill-valle-300 text-valle-500" />
            {reward.cost}
          </span>
          <button
            onClick={() => onRedeem(reward)}
            disabled={!canOpen}
            className={`min-h-9 cursor-pointer rounded-xl px-3 py-2 text-center font-super-pandora text-[11px] leading-tight shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-100 ${actionClass}`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
});

function GemBalance({ gems }: { gems: number }) {
  const displayedGems = useAnimatedValue(gems, 650);
  return <p className="font-candy-beans text-4xl leading-none text-lagos-700">{displayedGems}</p>;
}

function CategoryIcon({ category }: { category: Category }) {
  const Icon = categoryIcons[category];
  return <Icon className="h-4 w-4" />;
}

function RecentRewardItem({ item }: { item: RecentReward }) {
  const remaining = useRemainingTime(item.expiresAt);
  const detail =
    item.type === 'EXAM_BONUS_POINT'
      ? `${item.trimester}.º trimestre`
      : item.status === 'ACTIVE'
        ? `Activo · ${remaining ?? 'vence pronto'}`
        : item.status === 'USED'
          ? 'Utilizada'
          : 'Disponible';
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lagos-500 shadow-xs">
        <ReceiptText className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-super-pandora text-sm text-gray-800">{item.name}</p>
        <p className="font-simply-olive text-xs text-gray-500">
          {detail} · {formatRelativeDate(item.redeemedAt)}
        </p>
      </div>
    </li>
  );
}

function formatRelativeDate(value: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 2) return 'Canjeado recién';
  if (elapsedMinutes < 60) return `Canjeado hace ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Canjeado hace ${elapsedHours} h`;
  return `Canjeado hace ${Math.floor(elapsedHours / 24)} días`;
}

interface StoreClientProps {
  initialStore: RewardsStoreData;
  initialCatalog: AdminReward[];
  initialAdminRedemptions: AdminRewardRedemptionsPage | null;
  canManageCatalog: boolean;
}

export default function StoreClient({
  initialStore,
  initialCatalog,
  initialAdminRedemptions,
  canManageCatalog,
}: StoreClientProps) {
  const [store, setStore] = useState(initialStore);
  const [isRedeeming, startRedeemTransition] = useTransition();
  const [category, setCategory] = useState<Category>('ALL');
  const [selectedReward, setSelectedReward] = useState<StoreReward | null>(null);
  const [trimester, setTrimester] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [celebratedReward, setCelebratedReward] = useState<StoreReward | null>(null);
  const [activeTab, setActiveTab] = useState<StoreTab>('STORE');

  const rewards = useMemo(
    () =>
      category === 'ALL'
        ? store.rewards
        : store.rewards.filter((reward) => reward.category === category),
    [category, store.rewards],
  );
  const openRewardDialog = useCallback((reward: StoreReward) => {
    setSelectedReward(reward);
    setTrimester(null);
  }, []);
  const closeCelebration = useCallback(() => setCelebratedReward(null), []);
  const closeDialog = () => {
    if (!isRedeeming) {
      setSelectedReward(null);
      setTrimester(null);
    }
  };
  const confirmRedeem = () => {
    if (!selectedReward) return;
    const reward = selectedReward;
    startRedeemTransition(async () => {
      try {
        const nextStore = await redeemReward({
          rewardId: reward.id,
          trimester: trimester ?? undefined,
        });
        setStore(nextStore);
        setMessage(`¡Canje listo! ${reward.name} ya está en tus recompensas.`);
        setCelebratedReward(reward);
        setSelectedReward(null);
        setTrimester(null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No pudimos completar el canje');
      }
    });
  };

  return (
    <div className="space-y-5 rounded-[2.15rem] bg-[#f7fbff] p-2 pb-5 lg:space-y-6 lg:p-3">
      <section className="relative overflow-hidden rounded-[1.8rem] border border-[#69C507] bg-linear-to-r from-white via-[#69C507]/10 to-[#07c546]/20 px-5 py-6 shadow-md sm:px-7 sm:py-7">
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-17 w-17 shrink-0 overflow-hidden rounded-[1.35rem] bg-[#69C507]/10 shadow-inner">
              <Image src={shopImage} alt="" fill priority sizes="68px" className="object-cover" />
            </div>
            <div>
              <h1 className="font-super-pandora text-fluid-2xl text-gray-900">Tienda de canjes</h1>
              <p className="mt-1 max-w-xl font-simply-olive text-fluid-base text-gray-600">
                Usá tus gemas para obtener ventajas académicas y mejorar tu camino.
              </p>
            </div>
          </div>
          <div className="flex min-w-66 items-center justify-between gap-4 overflow-hidden rounded-[1.5rem] border border-lagos-100 bg-white px-4 py-3 shadow-sm">
            <div>
              <GemBalance gems={store.gems} />
              <p className="mt-1 font-simply-olive text-xs font-bold text-gray-500">
                Gemas disponibles
              </p>
            </div>
            <div
              className={`relative -my-3 -mr-3 h-25 w-25 shrink-0 sm:h-31 sm:w-31 ${celebratedReward ? 'animate-[pulse_700ms_ease-in-out_2]' : ''}`}
            >
              <Image
                src={diamondChestImage}
                alt="Cofre de gemas"
                fill
                sizes="(max-width: 640px) 100px, 124px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Secciones de la tienda" className="flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('STORE')}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 font-simply-olive text-sm font-bold transition ${activeTab === 'STORE' ? 'bg-linear-to-r from-pradera-500 to-pradera-600 text-white shadow-md' : 'border border-gray-100 bg-white text-gray-600 shadow-xs hover:-translate-y-0.5 hover:text-pradera-700'}`}
        >
          <LayoutGrid className="h-4 w-4" /> Tienda
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MY_REWARDS')}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 font-simply-olive text-sm font-bold transition ${activeTab === 'MY_REWARDS' ? 'bg-linear-to-r from-pradera-500 to-pradera-600 text-white shadow-md' : 'border border-gray-100 bg-white text-gray-600 shadow-xs hover:-translate-y-0.5 hover:text-pradera-700'}`}
        >
          <ReceiptText className="h-4 w-4" /> Mis recompensas
        </button>
        {canManageCatalog && (
          <button
            type="button"
            onClick={() => setActiveTab('ADMIN')}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 font-simply-olive text-sm font-bold transition ${activeTab === 'ADMIN' ? 'bg-linear-to-r from-castillo-500 to-castillo-600 text-white shadow-md' : 'border border-gray-100 bg-white text-gray-600 shadow-xs hover:-translate-y-0.5 hover:text-castillo-700'}`}
          >
            <ShieldCheck className="h-4 w-4" /> Administración
          </button>
        )}
      </nav>

      {activeTab === 'STORE' && (
        <>
          <section
            aria-label="Filtros de recompensas"
            className="relative flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {categories.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 font-simply-olive text-sm font-bold transition ${category === value ? 'bg-linear-to-r from-pradera-500 to-pradera-600 text-white shadow-md' : 'border border-gray-100 bg-white text-gray-600 shadow-xs hover:-translate-y-0.5 hover:text-pradera-700'}`}
              >
                <CategoryIcon category={value} />
                {label}
              </button>
            ))}
          </section>

          <section className="relative">
            <div className="mb-3 flex items-end justify-between gap-3 px-1">
              <div>
                <h2 className="font-super-pandora text-xl text-gray-900">
                  Recompensas disponibles
                </h2>
                <p className="font-simply-olive text-sm text-gray-500">
                  Elegí la ventaja que mejor acompañe tu aprendizaje.
                </p>
              </div>
              <span className="hidden rounded-full bg-white px-3 py-1 font-candy-beans text-sm text-lagos-600 shadow-sm sm:block">
                {rewards.length} disponibles
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} onRedeem={openRewardDialog} />
              ))}
            </div>
            {rewards.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                <LockKeyhole className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 font-super-pandora text-lg text-gray-700">
                  Próximamente habrá recompensas acá
                </p>
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[1.8rem] bg-linear-to-br from-lagos-600 via-bosque-700 to-bosque-800 px-5 py-6 text-white shadow-md sm:px-7">
            <Image
              src={shopWallpaperImage}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1200px"
              className="object-cover object-bottom"
            />
            <div aria-hidden className="absolute inset-0 bg-bosque-900/30" />
            <div className="relative max-w-2xl">
              <p className="font-candy-beans text-lg text-castillo-200">
                Subí de nivel con cada desafío
              </p>
              <h2 className="font-super-pandora text-2xl">
                ¡Seguí aprendiendo para conseguir más gemas!
              </h2>
              <p className="mt-1 font-simply-olive text-sm leading-6 text-white/85">
                Resolvé ejercicios, participá en concursos y completá actividades para obtener
                recompensas.
              </p>
              <button
                onClick={() => setGuideOpen(true)}
                className="mt-4 cursor-pointer rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 font-super-pandora text-sm text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-bosque-700"
              >
                ¿Cómo conseguir gemas?
              </button>
            </div>
          </section>
        </>
      )}

      {activeTab === 'MY_REWARDS' && (
        <section className="relative rounded-[1.7rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-br from-bosque-400 to-bosque-600 text-white shadow-sm">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-super-pandora text-xl text-gray-900">Mis recompensas</h2>
              <p className="font-simply-olive text-sm text-gray-500">Tus canjes más recientes.</p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {store.recentRewards.length ? (
              store.recentRewards.map((item) => <RecentRewardItem key={item.id} item={item} />)
            ) : (
              <li className="flex min-h-36 flex-col items-center justify-center text-center font-simply-olive text-sm text-gray-500 md:col-span-2 xl:col-span-3">
                <DynamicCodiMascot
                  animation="Codi_Rest"
                  label="Codi descansa mientras esperás tu primera recompensa"
                  className="h-28 w-28"
                />
                Todavía no hiciste canjes.
              </li>
            )}
          </ul>
        </section>
      )}

      {activeTab === 'ADMIN' && canManageCatalog && initialAdminRedemptions && (
        <div className="space-y-5">
          <RewardAdminPanel initialCatalog={initialCatalog} />
          <RewardRedemptionsAdminPanel initialData={initialAdminRedemptions} />
        </div>
      )}

      {selectedReward && (
        <StoreDialog
          reward={selectedReward}
          gems={store.gems}
          trimester={trimester}
          submitting={isRedeeming}
          onClose={closeDialog}
          onSelectTrimester={setTrimester}
          onConfirm={confirmRedeem}
        />
      )}
      <RedeemCelebration reward={celebratedReward} onClose={closeCelebration} />
      {message && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[110] flex max-w-sm items-center gap-3 rounded-2xl border-2 border-valle-500 bg-white px-3 py-3 shadow-[0_4px_0_0] shadow-valle-500"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-valle-100">
            <CircleCheck className="h-5 w-5 text-valle-500" strokeWidth={2.5} />
          </div>

          <p className="font-simply-olive flex-1 text-sm font-bold text-gray-700">{message}</p>

          <button
            onClick={() => setMessage(null)}
            aria-label="Cerrar"
            className="shrink-0 cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      )}
      {guideOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/30 p-4"
          onMouseDown={() => setGuideOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl"
          >
            <HelpCircle className="h-8 w-8 text-pradera-500" />
            <h2 className="mt-3 font-super-pandora text-2xl text-gray-900">Cómo conseguir gemas</h2>
            <p className="mt-2 font-simply-olive text-sm leading-6 text-gray-600">
              Completá ejercicios, resolvé problemas por primera vez y participá de las actividades
              propuestas por tu curso. Cada avance te acerca a una nueva recompensa.
            </p>
            <button
              onClick={() => setGuideOpen(false)}
              className="mt-5 cursor-pointer rounded-xl bg-gray-900 px-4 py-2.5 font-super-pandora text-sm text-white"
            >
              Entendido
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
