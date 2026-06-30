'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function completeLesson(lessonId: string) {
  const token = (await cookies()).get('session')?.value;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
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
  const token = (await cookies()).get('session')?.value;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/lessons/${lessonId}/uncomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Error al descompletar la lección');
  }

  revalidatePath('/dashboard');

  return res.json();
}
