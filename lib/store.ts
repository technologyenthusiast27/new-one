import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { PassType, Ticket, TicketStatus } from "./types";
import { PASS_MAP } from "./passes";
import { prisma } from "./prisma";
import { PassType as DbPassType, TicketStatus as DbTicketStatus } from "@prisma/client";

/**
 * Ticket store.
 *
 * With `DATABASE_URL` set, tickets persist to Postgres via Prisma —
 * the right choice for production / multi-instance deployments.
 * With no `DATABASE_URL`, falls back to a JSON file (`data/tickets.json`,
 * or in-memory on read-only/serverless filesystems) so the demo still
 * works out of the box with zero configuration.
 */
export const dbConfigured = Boolean(process.env.DATABASE_URL);

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tickets.json");

interface StoreShape {
  tickets: Ticket[];
}

const globalForStore = globalThis as unknown as {
  __hobMemoryStore?: StoreShape;
};

function memory(): StoreShape {
  if (!globalForStore.__hobMemoryStore) {
    globalForStore.__hobMemoryStore = { tickets: [] };
  }
  return globalForStore.__hobMemoryStore;
}

async function readAll(): Promise<Ticket[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return parsed.tickets ?? [];
  } catch (err: unknown) {
    // File missing → start empty. Any other read error → fall back to memory.
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    return memory().tickets;
  }
}

async function writeAll(tickets: Ticket[]): Promise<void> {
  memory().tickets = tickets;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ tickets }, null, 2), "utf8");
  } catch {
    // Read-only filesystem — memory fallback already updated above.
  }
}

function shortId(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export function makeTicketId(passType: PassType): string {
  return `HOB-${passType.toUpperCase()}-${shortId()}`;
}

// ── Prisma <-> Ticket mapping ──────────────────────────────────────
// Postgres enum stores "checked-in" as checked_in; the rest map 1:1.
type DbTicket = {
  id: string;
  passType: string;
  passName: string;
  quantity: number;
  seats: number;
  amount: number;
  name: string;
  email: string;
  phone: string;
  status: DbTicketStatus;
  createdAt: Date;
  checkedInAt: Date | null;
  paymentId: string | null;
  orderId: string | null;
  demo: boolean;
};

function fromDb(row: DbTicket): Ticket {
  return {
    id: row.id,
    passType: row.passType as PassType,
    passName: row.passName,
    quantity: row.quantity,
    seats: row.seats,
    amount: row.amount,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: (row.status === DbTicketStatus.checked_in
      ? "checked-in"
      : row.status) as TicketStatus,
    createdAt: row.createdAt.toISOString(),
    checkedInAt: row.checkedInAt?.toISOString(),
    paymentId: row.paymentId ?? undefined,
    orderId: row.orderId ?? undefined,
    demo: row.demo,
  };
}

function toDbStatus(status: TicketStatus): DbTicketStatus {
  return status === "checked-in" ? DbTicketStatus.checked_in : (status as DbTicketStatus);
}

function toDbPassType(passType: PassType): DbPassType {
  return passType as DbPassType;
}

export interface CreateTicketInput {
  passType: PassType;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  paymentId?: string;
  orderId?: string;
  demo?: boolean;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const pass = PASS_MAP[input.passType];
  const quantity = Math.max(1, Math.floor(input.quantity || 1));
  const ticket: Ticket = {
    id: makeTicketId(input.passType),
    passType: input.passType,
    passName: pass.name,
    quantity,
    seats: pass.seats * quantity,
    amount: pass.price * quantity,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    status: "confirmed",
    createdAt: new Date().toISOString(),
    paymentId: input.paymentId,
    orderId: input.orderId,
    demo: input.demo,
  };

  if (dbConfigured) {
    const row = await prisma.ticket.create({
      data: {
        id: ticket.id,
        passType: toDbPassType(ticket.passType),
        passName: ticket.passName,
        quantity: ticket.quantity,
        seats: ticket.seats,
        amount: ticket.amount,
        name: ticket.name,
        email: ticket.email,
        phone: ticket.phone,
        status: DbTicketStatus.confirmed,
        paymentId: ticket.paymentId,
        orderId: ticket.orderId,
        demo: ticket.demo ?? false,
      },
    });
    return fromDb(row as unknown as DbTicket);
  }

  const tickets = await readAll();
  tickets.push(ticket);
  await writeAll(tickets);
  return ticket;
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  if (dbConfigured) {
    const row = await prisma.ticket.findUnique({ where: { id } });
    return row ? fromDb(row as unknown as DbTicket) : undefined;
  }
  const tickets = await readAll();
  return tickets.find((t) => t.id === id);
}

export async function listTickets(): Promise<Ticket[]> {
  if (dbConfigured) {
    const rows = await prisma.ticket.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((r) => fromDb(r as unknown as DbTicket));
  }
  const tickets = await readAll();
  return [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<Ticket | undefined> {
  if (dbConfigured) {
    try {
      const row = await prisma.ticket.update({
        where: { id },
        data: {
          status: toDbStatus(status),
          checkedInAt: status === "checked-in" ? new Date() : undefined,
        },
      });
      return fromDb(row as unknown as DbTicket);
    } catch {
      return undefined;
    }
  }

  const tickets = await readAll();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  tickets[idx].status = status;
  if (status === "checked-in") {
    tickets[idx].checkedInAt = new Date().toISOString();
  }
  await writeAll(tickets);
  return tickets[idx];
}

export interface AdminStats {
  totalTickets: number;
  totalRevenue: number;
  totalGuests: number;
  checkedIn: number;
  byPass: Record<PassType, { count: number; revenue: number }>;
}

export async function getStats(): Promise<AdminStats> {
  const tickets = dbConfigured
    ? (await prisma.ticket.findMany()).map((r) => fromDb(r as unknown as DbTicket))
    : await readAll();

  const byPass = {
    normal: { count: 0, revenue: 0 },
    vip: { count: 0, revenue: 0 },
    group: { count: 0, revenue: 0 },
  } as AdminStats["byPass"];

  let totalRevenue = 0;
  let totalGuests = 0;
  let checkedIn = 0;

  for (const t of tickets) {
    if (t.status === "cancelled") continue;
    totalRevenue += t.amount;
    totalGuests += t.seats;
    if (t.status === "checked-in") checkedIn += 1;
    byPass[t.passType].count += t.quantity;
    byPass[t.passType].revenue += t.amount;
  }

  return {
    totalTickets: tickets.filter((t) => t.status !== "cancelled").length,
    totalRevenue,
    totalGuests,
    checkedIn,
    byPass,
  };
}
