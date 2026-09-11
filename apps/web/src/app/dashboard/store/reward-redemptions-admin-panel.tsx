'use client';

import { useState, useTransition } from 'react';
import { Ban, ChevronLeft, ChevronRight, Gem, Gift, UsersRound } from '@/components/ui/Icon';
import type { AdminRewardRedemptionsPage, RewardRedemptionSummary } from '@codi/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getAdminRewardRedemptions, revokeRewardRedemption } from './actions';

interface RewardRedemptionsAdminPanelProps {
  initialData: AdminRewardRedemptionsPage;
}

function redemptionState(redemption: RewardRedemptionSummary) {
  if (redemption.redemptionStatus === 'REVOKED') return 'Revocada';
  if (redemption.entitlementStatus === 'ACTIVE') return 'Activa';
  if (redemption.entitlementStatus === 'AVAILABLE') return 'Disponible';
  if (redemption.entitlementStatus === 'USED') return 'Utilizada';
  if (redemption.entitlementStatus === 'EXPIRED') return 'Vencida';
  return 'Sin derecho activo';
}

export function RewardRedemptionsAdminPanel({ initialData }: RewardRedemptionsAdminPanelProps) {
  const [data, setData] = useState(initialData);
  const [redemptionToRevoke, setRedemptionToRevoke] = useState<RewardRedemptionSummary | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changePage(page: number) {
    startTransition(async () => {
      try {
        setData(await getAdminRewardRedemptions(page));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo cargar la página.');
      }
    });
  }

  function revokeSelectedRedemption() {
    if (!redemptionToRevoke) return;
    startTransition(async () => {
      try {
        await revokeRewardRedemption(redemptionToRevoke.id);
        setData((current) => ({
          ...current,
          items: current.items.map((student) => ({
            ...student,
            redemptions: student.redemptions.map((redemption) =>
              redemption.id === redemptionToRevoke.id
                ? {
                    ...redemption,
                    redemptionStatus: 'REVOKED',
                    entitlementStatus: null,
                    canRevoke: false,
                  }
                : redemption,
            ),
          })),
        }));
        setNotice('La recompensa fue revocada. Las gemas no se reintegraron.');
        setRedemptionToRevoke(null);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo revocar la recompensa.');
      }
    });
  }

  return (
    <section className="rounded-[1.7rem] border border-castillo-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-castillo-50 text-castillo-700">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-super-pandora text-xl text-gray-900">Canjes de estudiantes</h2>
            <p className="font-simply-olive text-sm text-gray-500">
              {data.totalStudents} estudiantes · páginas de {data.pageSize}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-castillo-50 px-3 py-1 font-candy-beans text-sm text-castillo-700">
          {data.page}/{data.totalPages}
        </span>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-castillo-50 px-3 py-2 font-simply-olive text-sm text-castillo-800"
        >
          {notice}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {data.items.map((student) => (
          <details
            key={student.id}
            className="group rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
            open={student.redemptions.length > 0}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-castillo-600 shadow-xs">
                <UsersRound className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-super-pandora text-sm text-gray-900">
                  {student.displayName}
                </span>
                <span className="font-simply-olive text-xs text-gray-500">
                  @{student.username} · {student.redemptions.length} canjes
                </span>
              </span>
              <span className="flex items-center gap-1 font-candy-beans text-sm text-lagos-700">
                <Gem className="h-4 w-4 fill-valle-300 text-valle-500" /> {student.gems}
              </span>
            </summary>
            {student.redemptions.length ? (
              <ul className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                {student.redemptions.map((redemption) => (
                  <li
                    key={redemption.id}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
                  >
                    <Gift className="h-4 w-4 shrink-0 text-pradera-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-super-pandora text-sm text-gray-800">
                        {redemption.rewardName}
                      </p>
                      <p className="font-simply-olive text-xs text-gray-500">
                        {redemptionState(redemption)} · {redemption.redeemedAt.slice(0, 10)}
                        {redemption.trimester ? ` · ${redemption.trimester}.º trimestre` : ''}
                      </p>
                    </div>
                    {redemption.canRevoke && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setRedemptionToRevoke(redemption)}
                        className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Revocar ${redemption.rewardName}`}
                        title="Revocar recompensa"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-gray-200 pt-3 font-simply-olive text-sm text-gray-500">
                Todavía no tiene canjes.
              </p>
            )}
          </details>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          disabled={isPending || data.page === 1}
          onClick={() => changePage(data.page - 1)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 font-super-pandora text-xs text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button
          type="button"
          disabled={isPending || data.page === data.totalPages}
          onClick={() => changePage(data.page + 1)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 font-super-pandora text-xs text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(redemptionToRevoke)}
        title="¿Revocar esta recompensa?"
        description={`Quitarás “${redemptionToRevoke?.rewardName ?? ''}” del estudiante. Esta acción no reintegra gemas.`}
        isPending={isPending}
        onCancel={() => setRedemptionToRevoke(null)}
        onConfirm={revokeSelectedRedemption}
      />
    </section>
  );
}
