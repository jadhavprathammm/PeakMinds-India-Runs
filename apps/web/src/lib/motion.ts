// Shared Framer Motion primitives.
// Single source of truth for easing curves so the Hero (and future sections)
// animate with one consistent feel. Framer Motion v12 requires cubic-bezier
// easings to be typed as a fixed 4-number tuple, not number[].

export const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];
export const easeInOutSoft: [number, number, number, number] = [0.4, 0, 0.2, 1];
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
