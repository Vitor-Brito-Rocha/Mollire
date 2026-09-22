export const turmaKeys = {
  all: ["turmas"] as const,
  mine: () => [...turmaKeys.all, "mine"] as const,
  public: () => [...turmaKeys.all, "public"] as const,
  detail: (id: string) => [...turmaKeys.all, "detail", id] as const,
  students: (id: string) => [...turmaKeys.all, "students", id] as const,
  gallery: (id: string) => [...turmaKeys.all, "gallery", id] as const,
};
