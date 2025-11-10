import { getQueryConfigForPath, queriesConfig } from '@/shared/config/routes';
import { useQueryClient } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { Link, LinkProps, matchPath } from 'react-router-dom';

interface LinkWithPrefetchProps extends LinkProps {
  children: ReactNode;
  delay?: number; // Delay before prefetch (ms)
  ttl?: number; // Cache time to live (ms)
}

const LinkWithPrefetch = ({
  children,
  delay = 200,
  to,
  ttl = 5 * 60 * 1000,
  ...linkProps
}: LinkWithPrefetchProps) => {
  const queryClient = useQueryClient();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const path = typeof to === 'string' ? to : to.pathname;
      if (!path) return;

      const result = getQueryConfigForPath(path);

      if (result) {
        const { config, params } = result;

        queryClient.prefetchQuery(config.getQueryOptions(params as any));
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <Link to={to} {...linkProps} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </Link>
  );
};

export default LinkWithPrefetch;
