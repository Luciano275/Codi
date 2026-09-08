export const queryKeys = {
  user: {
    me: ['user', 'me'] as const,
  },
  lessons: {
    status: (id: string) => ['lessons', 'status', id] as const,
    admin: {
      all: ['lessons', 'admin'] as const,
    },
  },
  courses: {
    all: ['courses'] as const,
    admin: {
      all: ['courses', 'admin', 'list'] as const,
      byId: (id: string) => ['courses', 'admin', id] as const,
    },
  },
  islands: {
    all: ['islands'] as const,
    admin: {
      all: ['islands', 'admin', 'list'] as const,
      byId: (id: string) => ['islands', 'admin', id] as const,
    },
  },
  problems: {
    detail: (id: string) => ['problems', id] as const,
    template: (id: string, lang: string) => ['problems', id, 'template', lang] as const,
  },
  submissions: {
    all: ['submissions'] as const,
  },
  modules: {
    admin: {
      byCourseId: (courseId: string) => ['modules', 'admin', courseId] as const,
    },
  },
  rewards: {
    store: ['rewards', 'store'] as const,
  },
};
