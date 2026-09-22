import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { resetPasswordAction, toggleActiveAction } from '../actions';
import { CreateEmployeeForm } from './create-form';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  accounts: 'Accounts',
  hr: 'HR',
  employee: 'Employee',
};

export default async function AdminUsersPage() {
  // Middleware guards /admin too — re-check here (defense in depth).
  const session = await auth();
  if (session?.user.role !== 'super_admin') redirect('/');

  const users = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      username: profiles.username,
      role: profiles.role,
      department: profiles.department,
      designation: profiles.designation,
      active: profiles.active,
    })
    .from(profiles)
    .orderBy(asc(profiles.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Employee accounts</h1>
        <p className="text-sm text-gray-500">
          Create sign-ins, reset passwords, deactivate leavers. There is no
          self-signup — accounts are made here only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Give the employee their username and password — they can be reset
            from the list below at any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateEmployeeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All accounts ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">
                      {u.department ?? '—'}
                      {u.designation ? ` · ${u.designation}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? 'default' : 'secondary'}>
                      {u.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <details className="text-left">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                          Reset…
                        </summary>
                        <form
                          action={resetPasswordAction}
                          className="mt-2 flex items-center gap-1"
                        >
                          <input type="hidden" name="id" value={u.id} />
                          <Input
                            name="newPassword"
                            type="password"
                            required
                            minLength={4}
                            autoComplete="new-password"
                            placeholder="New password"
                            className="h-8 w-36"
                          />
                          <Button type="submit" size="sm">
                            Set
                          </Button>
                        </form>
                      </details>
                      <form action={toggleActiveAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="toActive"
                          value={u.active ? '0' : '1'}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={u.active ? 'destructive' : 'outline'}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No accounts yet — create the first one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
