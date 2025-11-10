import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryConfigForPath } from '@/shared/config/routes';

interface OptimisticLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  prefetchDelay?: number;
  navigationDelay?: number;
}

const OptimisticLink = ({
  to,
  children,
  className,
  style,
  prefetchDelay = 200,
  navigationDelay = 1000,
}: OptimisticLinkProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);
  const [NProgress, setNProgress] = useState<any>(null);

  // Load NProgress only on client
  useEffect(() => {
    // Dynamic import that only runs on client
    Promise.all([import('nprogress'), import('nprogress/nprogress.css')])
      .then(([nprogressModule]) => {
        const np = nprogressModule.default;
        np.configure({
          showSpinner: false,
          trickleSpeed: 200,
          minimum: 0.1,
        });
        setNProgress(() => np);
      })
      .catch((error) => {
        console.error('Failed to load nprogress:', error);
      });
  }, []);

  const handleMouseEnter = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    prefetchTimeoutRef.current = setTimeout(() => {
      const result = getQueryConfigForPath(to);
      if (result) {
        const { config, params } = result;
        queryClient.prefetchQuery(config.getQueryOptions(params as any));
      }
    }, prefetchDelay);
  };

  const handleMouseLeave = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const result = getQueryConfigForPath(to);

    if (!result) {
      navigate(to);
      isNavigatingRef.current = false;
      return;
    }

    const { config, params } = result;
    const queryOptions = config.getQueryOptions(params as any);

    const cachedData = queryClient.getQueryData(queryOptions.queryKey!);
    if (cachedData) {
      navigate(to);
      isNavigatingRef.current = false;
      return;
    }

    if (NProgress) {
      NProgress.start();
    }
    const fetchPromise = queryClient.fetchQuery(queryOptions);
    const navigationPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, navigationDelay);
    });

    try {
      await Promise.race([fetchPromise, navigationPromise]);
    } catch (error) {
      console.error('Navigation fetch error:', error);
    } finally {
      if (NProgress) NProgress.done();
      navigate(to);
      isNavigatingRef.current = false;
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        textDecoration: 'underline',
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default OptimisticLink;
