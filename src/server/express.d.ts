// src/types/express.d.ts
import { ViteDevServer } from 'vite';
import { PageModel } from '../shared/models/page.ts';
import { BFFService } from './service/bff.ts';

declare global {
  namespace Express {
    interface Request {
      vite: ViteDevServer | null;
      bff: BFFService;
    }
    interface Response {
      renderPage: (pageData: PageModel) => Promise<void>;
    }
  }
}

export {};
