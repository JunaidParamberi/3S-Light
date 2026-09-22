'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { createEmployee, type CreateEmployeeState } from '../actions';

const initialState: CreateEmployeeState = {};

export function CreateEmployeeForm() {
  const [state, formAction, pending] = useActionState(createEmployee, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="name">Full name *</Label>
        <Input id="name" name="name" required placeholder="e.g. Ahmed Khan" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          name="username"
          required
          autoComplete="off"
          placeholder="e.g. EMP-042"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Initial password *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={4}
          autoComplete="new-password"
          placeholder="4+ characters"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="employee"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="accounts">Accounts</option>
          <option value="hr">HR</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="employeeId">Employee ID</Label>
        <Input id="employeeId" name="employeeId" placeholder="e.g. EMP-042" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="department">Department</Label>
        <Input id="department" name="department" placeholder="e.g. Sales" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="designation">Designation</Label>
        <Input id="designation" name="designation" placeholder="e.g. Technician" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="vehicleRegistration">Usual vehicle</Label>
        <Input
          id="vehicleRegistration"
          name="vehicleRegistration"
          placeholder="e.g. D 12345"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-600 sm:col-span-2">{state.success}</p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Creating…' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
