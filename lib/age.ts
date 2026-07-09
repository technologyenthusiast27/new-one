// Shared age-policy helpers used by public pages, admin, tickets and email.
import type { Event } from "./types";

export type AgeCategory = "all_ages" | "13_plus" | "16_plus" | "18_plus";

export const AGE_CATEGORIES: AgeCategory[] = [
  "all_ages",
  "13_plus",
  "16_plus",
  "18_plus",
];

/** Numeric minimum age for a category (0 = no minimum). */
export const AGE_CATEGORY_MIN: Record<AgeCategory, number> = {
  all_ages: 0,
  "13_plus": 13,
  "16_plus": 16,
  "18_plus": 18,
};

/** Short badge label, e.g. "18+" or "All ages". */
export function ageCategoryLabel(c: AgeCategory): string {
  switch (c) {
    case "all_ages":
      return "All ages";
    case "13_plus":
      return "13+";
    case "16_plus":
      return "16+";
    case "18_plus":
      return "18+";
  }
}

/** Longer descriptive phrase for prose. */
export function ageCategoryDescription(c: AgeCategory): string {
  switch (c) {
    case "all_ages":
      return "Open to all ages";
    case "13_plus":
      return "Attendees must be 13 or older";
    case "16_plus":
      return "Attendees must be 16 or older";
    case "18_plus":
      return "Strictly 18 and over";
  }
}

/** Does this event admit attendees under 18? */
export function allowsMinors(event: Pick<Event, "ageCategory" | "minorsAllowed">): boolean {
  return event.ageCategory !== "18_plus" && event.minorsAllowed;
}
