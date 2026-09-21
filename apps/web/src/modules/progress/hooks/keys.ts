export const progressKeys = {
  all: ["progress"] as const,
  quests: () => [...progressKeys.all, "quests"] as const,
  achievements: (handle: string) => [...progressKeys.all, "achievements", handle] as const,
  xpHistory: () => [...progressKeys.all, "xp-history"] as const,
};
