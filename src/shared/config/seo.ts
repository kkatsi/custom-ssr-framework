import { PageModel, UserProfilePage } from '../models/page.js';

export interface SEOMetadata {
  title: string;
  description: string;
  image?: string;
  keywords?: string[];
  canonical?: string;
  ogType?: 'website' | 'article' | 'profile' | 'product';
  noindex?: boolean;
  nofollow?: boolean;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

type SEOConfig<TPageData extends PageModel> = {
  getMetadata: (pageData: TPageData, url: string) => SEOMetadata;
};

export const seoConfig = {
  UserProfilePage: {
    getMetadata: (pageData: UserProfilePage, url: string): SEOMetadata => ({
      title: `${pageData.firstName} ${pageData.lastName} - User Profile`,
      description: `View ${pageData.firstName} ${pageData.lastName}'s profile. ${pageData.email}`,
      image: pageData.image,
      keywords: ['profile', 'user', pageData.username],
      canonical: url,
      ogType: 'profile',
      twitterCard: 'summary_large_image',
    }),
  } satisfies SEOConfig<UserProfilePage>,

  EmptyPage: {
    getMetadata: (_pageData: any, url: string): SEOMetadata => ({
      title: 'My App - Welcome',
      description: 'Welcome to My App',
      image: '/og-default.png',
      canonical: url,
      ogType: 'website',
      twitterCard: 'summary',
    }),
  },
} as const;

export function getSEOMetadata(pageData: PageModel, url: string): SEOMetadata {
  const config = seoConfig[pageData.$type];
  if (!config) {
    console.warn(`No SEO config found for page type: ${pageData.$type}`);
    return seoConfig.EmptyPage.getMetadata(pageData, url);
  }
  return config.getMetadata(pageData as any, url);
}
