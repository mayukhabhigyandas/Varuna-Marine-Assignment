export const TARGET_GHG_INTENSITY = 89.3368;

export const TAB_NAMES = ["Routes", "Compare", "Banking", "Pooling"] as const;

export type TabName = (typeof TAB_NAMES)[number];
