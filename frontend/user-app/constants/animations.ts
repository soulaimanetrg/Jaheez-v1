export const SPRING_DEFAULT = { damping: 15, stiffness: 150, mass: 1 } as const;
export const SPRING_SNAPPY = { damping: 20, stiffness: 300, mass: 0.8 } as const;
export const SPRING_GENTLE = { damping: 20, stiffness: 100, mass: 1.2 } as const;
export const SPRING_BOUNCY = { damping: 10, stiffness: 180, mass: 0.9 } as const;

export const FADE_IN = { duration: 200 } as const;
export const FADE_OUT = { duration: 150 } as const;
export const SLIDE_UP = { damping: 20, stiffness: 100, mass: 1.2 } as const;

export const SCALE_PRESS = 0.97 as const;
export const SCALE_CARD_PRESS = 0.98 as const;
export const TAB_BOUNCE = { from: 0.8, overshoot: 1.1, to: 1 } as const;

export const STAGGER_DELAY = 50 as const;
export const TRANSITION_FAST = 150 as const;
export const TRANSITION_DEFAULT = 200 as const;
export const TRANSITION_SLOW = 350 as const;
