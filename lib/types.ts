export type PassType = "normal" | "group" | "vip";

export interface Pass {
  id: PassType;
  name: string;
  price: number; // in INR (rupees)
  seats: number; // number of people admitted per pass
  tagline: string;
  perks: string[];
  featured?: boolean;
}

export type TicketStatus = "confirmed" | "checked-in" | "cancelled";

export interface Ticket {
  id: string; // public ticket id, e.g. HOB-VIP-3F7A2C
  passType: PassType;
  passName: string;
  quantity: number; // number of passes purchased
  seats: number; // total people admitted
  amount: number; // total paid in INR
  name: string;
  email: string;
  phone: string;
  status: TicketStatus;
  createdAt: string; // ISO
  checkedInAt?: string; // ISO
  paymentId?: string;
  orderId?: string;
  demo?: boolean;
}

export interface CreateOrderPayload {
  passType: PassType;
  quantity: number;
  name: string;
  email: string;
  phone: string;
}
