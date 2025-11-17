import { UseQueryOptions } from '@tanstack/react-query';
import { UserProfilePage } from '../models/page.js';
import { generatePath, matchPath } from 'react-router-dom';

export const pagesRoutes = {
  userProfile: '/users/:id',
} as const;

export const apiRoutes = {
  userProfile: '/api/users/:id',
};

type QueryConfig<TParams extends Record<string, string>> = {
  pattern: string; // Route pattern for matching
  getQueryOptions: (params: TParams) => UseQueryOptions;
};

export const queriesConfig = {
  [pagesRoutes.userProfile]: {
    pattern: pagesRoutes.userProfile,
    getQueryOptions: ({ id }) => ({
      queryKey: ['user', id] as const,
      queryFn: async (): Promise<UserProfilePage> => {
        const response = await fetch(generatePath(apiRoutes.userProfile, { id }));
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    }),
  } satisfies QueryConfig<{ id: string }>,
};

export function getQueryConfigForPath(path: string) {
  for (const config of Object.values(queriesConfig)) {
    const match = matchPath(config.pattern, path);
    if (match) {
      return { config, params: match.params };
    }
  }
  return null;
}

export type RoutesConfig = typeof queriesConfig;
export type RouteKey = keyof RoutesConfig;
