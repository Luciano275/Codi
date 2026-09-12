'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/server-api';
import { fetchBackendWithSession } from '@/lib/server/backend-api';

export async function completeLesson(lessonId: string) {
  const res = await fetchBackendWithSession(`/api/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 409) {
    return { completed: true, xpAwarded: 0 };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error al completar la lección');
  }

  revalidatePath('/dashboard');

  return res.json();
}

export async function uncompleteLesson(lessonId: string) {
  const res = await fetchBackendWithSession(`/api/lessons/${lessonId}/uncomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error al descompletar la lección');
  }

  revalidatePath('/dashboard');

  return res.json();
}

export async function unlockLessonSmartHint(lessonId: string) {
  const result = await serverFetch<{ hint: string }>(`/api/lessons/${lessonId}/smart-hint/unlock`, {
    method: 'POST',
  });
  revalidatePath(`/dashboard/lessons/${lessonId}`);
  revalidatePath('/dashboard/store');
  return result;
}
