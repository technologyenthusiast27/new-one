import type { Pass, PassType } from "./types";

export const EVENT = {
  name: "HOUSE OF BALLOONS",
  presenter: "Wolves Production",
  tagline: "A cinematic night of sound, light & indulgence.",
  date: "Saturday, 20 December 2026",
  dateShort: "20 DEC 2026",
  doorsOpen: "7:00 PM",
  venue: "The Grand Pavilion",
  city: "Mumbai, India",
  currency: "₹",
};

export const PASSES: Pass[] = [
  {
    id: "normal",
    name: "Normal",
    price: 999,
    seats: 1,
    tagline: "Your entry to the night.",
    perks: [
      "General admission entry",
      "Access to main arena & bars",
      "Digital QR ticket",
      "Complimentary welcome drink",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: 1499,
    seats: 1,
    tagline: "Elevated, up close, unforgettable.",
    featured: true,
    perks: [
      "Priority fast-track entry",
      "Exclusive VIP lounge & viewing deck",
      "Dedicated premium bar",
      "Two complimentary drinks",
      "Event keepsake & merch drop",
    ],
  },
  {
    id: "group",
    name: "Group",
    price: 4999,
    seats: 5,
    tagline: "Bring the crew. Save together.",
    perks: [
      "Admission for 5 guests",
      "Reserved group table (subject to availability)",
      "Skip-the-line group entry",
      "5 complimentary welcome drinks",
      "Best value — ₹1,000/head",
    ],
  },
];

export function getPass(type: PassType): Pass | undefined {
  return PASSES.find((p) => p.id === type);
}

export const PASS_MAP: Record<PassType, Pass> = PASSES.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<PassType, Pass>,
);
