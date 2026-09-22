'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import type { UserRole } from '@/types/next-auth';
import { hashPin } from '@/lib/hash';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';

// Only these roles can be handed out from the UI — minting another super
// admin is a seed-script operation, not a screen.
const ASSIGNABLE_ROLES: readonly string[] = ['employee', 'manager', 'accounts', 'hr'];

// Defense in depth: middleware already guards /admin, but every action
// re-checks the session itself (server actions are callable directly).
async function requireSuperAdmin(): Promise<{ userId: string }> {
  const session = await auth();
  if (session?.user.role !== 'super_admin') {
    throw new Error('Forbidden — super admin only');
  }
  return { userId: session.user.id };
}

export type CreateEmployeeState = {
  error?: string;
  success?: string;
};

export async function createEmployee(
  _prev: CreateEmployeeState,
  formData: FormData,
): Promise<CreateEmployeeState> {
  await requireSuperAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim();
  const role = String(formData.get('role') ?? 'employee');
  const password = String(formData.get('password') ?? '');
  const employeeId = String(formData.get('employeeId') ?? '').trim() || null;
  const department = String(formData.get('department') ?? '').trim() || null;
  const designation = String(formData.get('designation') ?? '').trim() || null;
  const vehicleRegistration =
    String(formData.get('vehicleRegistration') ?? '').trim() || null;

  if (!name) return { error: 'Name is required.' };
  if (!username) return { error: 'Username is required.' };
  if (password.length < 4) return { error: 'Password must be at least 4 characters.' };
  if (!ASSIGNABLE_ROLES.includes(role)) return { error: 'Invalid role.' };

  const [dupe] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  if (dupe) return { error: `Username "${username}" already exists.` };

  try {
    await db.insert(profiles).values({
      id: randomUUID(),
      role: role as UserRole,
      name,
      username,
      employeeId,
      department,
      designation,
      vehicleRegistration,
      passwordHash: hashPin(password),
      active: true,
    });
  } catch {
    // unique-constraint race, in case two creates were submitted at once
    return { error: `Username "${username}" already exists.` };
  }

  revalidatePath('/admin/users');
  return { success: `${name} can now sign in with username "${username}".` };
}

export async function toggleActiveAction(formData: FormData) {
  const { userId } = await requireSuperAdmin();
  const id = String(formData.get('id') ?? '');
  const toActive = String(formData.get('toActive')) === '1';
  if (!id) return;
  // Never let the signed-in super admin lock themselves out.
  if (!toActive && id === userId) return;

  await db.update(profiles).set({ active: toActive }).where(eq(profiles.id, id));
  revalidatePath('/admin/users');
}

export async function resetPasswordAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get('id') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  // The form enforces minLength=4; this is the server-side backstop.
  if (!id || newPassword.length < 4) return;

  await db
    .update(profiles)
    .set({ passwordHash: hashPin(newPassword) })
    .where(eq(profiles.id, id));
  revalidatePath('/admin/users');
}
