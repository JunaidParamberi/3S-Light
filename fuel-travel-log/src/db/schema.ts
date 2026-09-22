import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ── Enums ────────────────────────────────────────────────────────────
export const userRole = pgEnum('user_role', ['employee', 'manager', 'accounts', 'hr']);
export const tripStatus = pgEnum('trip_status', ['submitted', 'approved', 'rejected', 'validated']);

// ── profiles: who is logged in + their details (Excel header block) ──
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = Auth.js (NextAuth) user id
  role: userRole('role').notNull().default('employee'),
  name: text('name').notNull(),
  employeeId: text('employee_id'), // Excel "EMPLOYEE ID"
  designation: text('designation'), // Excel "DESIGNATION"
  department: text('department'), // Excel "DEPARTMENT"
  division: text('division'), // Excel "DIVISION"
  vehicleRegistration: text('vehicle_registration'), // usual vehicle — pre-fill suggestion only
  pinHash: text('pin_hash'), // scrypt hash of employee's login PIN (never stored raw)
  managerId: uuid('manager_id'), // who approves this person's trips
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── vehicles: the "vehicle file" (one record per company vehicle) ────
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationNumber: text('registration_number').notNull().unique(), // VEHICLE REGISTRATION #
  make: text('make'),
  model: text('model'),
  currentHolder: uuid('current_holder'), // who has it right now (swap-safe)
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── trips: one row per fuel-log entry (mirrors Excel columns A–L) ────
export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  vehicleId: uuid('vehicle_id').notNull(), // which vehicle was driven
  travelDate: date('travel_date').notNull(), // A: TRAVEL DATE
  startMeter: numeric('start_meter').notNull(), // B: STARTING METER READING
  endMeter: numeric('end_meter').notNull(), // C: CLOSING METER READING
  // generated in DB — never typed, never summed over the wrong range
  km: numeric('km').generatedAlwaysAs(sql`end_meter - start_meter`), // F: TOTAL KM
  fromPlace: text('from_place'), // D: FROM
  toPlace: text('to_place'), // E: TO
  fuelAmount: numeric('fuel_amount').notNull().default('0'), // G: FUEL AMOUNT
  salikAmount: numeric('salik_amount').notNull().default('0'), // H: SALIK
  parkingAmount: numeric('parking_amount').notNull().default('0'), // I: PARKING
  billPhotoUrl: text('bill_photo_url'), // petrol/Salik bill photo (Vercel Blob)
  remarks: text('remarks'), // J: REMARKS
  purpose: text('purpose'), // K: PURPOSE
  status: tripStatus('status').notNull().default('submitted'), // L: approval flow
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  validatedBy: uuid('validated_by'), // HR validation
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  month: text('month').generatedAlwaysAs(sql`to_char(travel_date, 'YYYY-MM')`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Types for use across the app
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
