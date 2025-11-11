import { getQueryConfigForPath } from '@/shared/config/routes';
import { getSEOMetadata } from '@/shared/config/seo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useUpdateDocumentTitle = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const result = getQueryConfigForPath(location.pathname);

    if (result) {
      const { config, params } = result;
      const queryOptions = config.getQueryOptions(params as any);

      const pageData = queryClient.getQueryData(queryOptions.queryKey!);

      if (pageData) {
        const metadata = getSEOMetadata(pageData as any, location.pathname);

        document.title = metadata.title;
      } else {
        // Set a default title while loading
        document.title = 'Loading...';
      }
    }
  }, [location.pathname, queryClient]);
};

export default useUpdateDocumentTitle;
