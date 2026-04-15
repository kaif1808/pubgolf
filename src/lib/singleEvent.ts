/** Single deployment: Barcelona Pub Golf only ([pubgolf.html](pubgolf.html)). */

export const SINGLE_EVENT_SLUG =
  process.env.NEXT_PUBLIC_EVENT_SLUG?.trim() || "barcelona-pub-golf";

export const SINGLE_EVENT_TITLE = "Barcelona Pub Golf";

export function isAllowedEventSlug(slug: string): boolean {
  return slug === SINGLE_EVENT_SLUG;
}

/** Placeholder — organizer keys are not used; column remains for legacy schema. */
export const UNUSED_ORGANIZER_KEY_HASH = "unused";
