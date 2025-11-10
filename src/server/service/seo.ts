import { SEOMetadata } from '@/shared/config/seo.js';

export class SEOBuilder {
  private metadata: SEOMetadata;
  private baseUrl: string;

  constructor(metadata: SEOMetadata, baseUrl: string = 'https://myapp.com') {
    this.metadata = metadata;
    this.baseUrl = baseUrl;
  }

  buildTags(): string {
    const tags: string[] = [];

    // Basic meta tags
    tags.push(`<title>${this.escapeHtml(this.metadata.title)}</title>`);
    tags.push(
      `<meta name="description" content="${this.escapeHtml(this.metadata.description)}" />`
    );

    if (this.metadata.keywords) {
      tags.push(`<meta name="keywords" content="${this.metadata.keywords.join(', ')}" />`);
    }

    if (this.metadata.canonical) {
      tags.push(`<link rel="canonical" href="${this.baseUrl}${this.metadata.canonical}" />`);
    }

    // Robots meta
    if (this.metadata.noindex || this.metadata.nofollow) {
      const robots = [
        this.metadata.noindex ? 'noindex' : 'index',
        this.metadata.nofollow ? 'nofollow' : 'follow',
      ].join(', ');
      tags.push(`<meta name="robots" content="${robots}" />`);
    }

    // Open Graph tags
    tags.push(`<meta property="og:title" content="${this.escapeHtml(this.metadata.title)}" />`);
    tags.push(
      `<meta property="og:description" content="${this.escapeHtml(this.metadata.description)}" />`
    );
    tags.push(`<meta property="og:type" content="${this.metadata.ogType || 'website'}" />`);

    if (this.metadata.canonical) {
      tags.push(`<meta property="og:url" content="${this.baseUrl}${this.metadata.canonical}" />`);
    }

    if (this.metadata.image) {
      const imageUrl = this.metadata.image.startsWith('http')
        ? this.metadata.image
        : `${this.baseUrl}${this.metadata.image}`;
      tags.push(`<meta property="og:image" content="${imageUrl}" />`);
      tags.push(`<meta property="og:image:width" content="1200" />`);
      tags.push(`<meta property="og:image:height" content="630" />`);
    }

    tags.push(`<meta property="og:site_name" content="My App" />`);
    tags.push(`<meta property="og:locale" content="en_US" />`);

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="${this.metadata.twitterCard || 'summary'}" />`);
    tags.push(`<meta name="twitter:title" content="${this.escapeHtml(this.metadata.title)}" />`);
    tags.push(
      `<meta name="twitter:description" content="${this.escapeHtml(this.metadata.description)}" />`
    );

    if (this.metadata.image) {
      const imageUrl = this.metadata.image.startsWith('http')
        ? this.metadata.image
        : `${this.baseUrl}${this.metadata.image}`;
      tags.push(`<meta name="twitter:image" content="${imageUrl}" />`);
    }

    // Twitter site handle (configure this)
    tags.push(`<meta name="twitter:site" content="@myapp" />`);

    return tags.join('\n    ');
  }

  buildStructuredData(): string {
    // JSON-LD structured data for rich snippets
    const structuredData: any = {
      '@context': 'https://schema.org',
    };

    if (this.metadata.ogType === 'profile') {
      structuredData['@type'] = 'Person';
      structuredData.name = this.metadata.title.split(' - ')[0];
    } else if (this.metadata.ogType === 'product') {
      structuredData['@type'] = 'Product';
      structuredData.name = this.metadata.title;
      structuredData.description = this.metadata.description;
      if (this.metadata.image) {
        structuredData.image = this.metadata.image;
      }
    } else {
      structuredData['@type'] = 'WebPage';
      structuredData.name = this.metadata.title;
      structuredData.description = this.metadata.description;
    }

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}
