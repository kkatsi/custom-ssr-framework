import { Request, Response, NextFunction } from 'express';
import { PageModel } from '../../shared/models/page.js';

export const ssrMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Dynamically type the handler
    let buildHtmlPage: (req: Request, pageData: PageModel) => Promise<string>;

    if (req.vite) {
      // === DEVELOPMENT ===
      // Load the module on-the-fly using Vite.
      // This ensures HMR for all server-side code and components.
      const module = await req.vite.ssrLoadModule(
        '/src/server/utils.js' // Path from project root
      );
      buildHtmlPage = module.buildHtmlPage;
    } else {
      // === PRODUCTION ===
      // Import the bundled module
      const module = await import('../utils.js'); // Adjust path
      buildHtmlPage = module.buildHtmlPage;
    }

    res.renderPage = async (pageData: PageModel) => {
      try {
        const html = await buildHtmlPage(req, pageData);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (e) {
        console.error('❌ Server error:', e);
        res.status(500).send(e);
      }
    };
    next();
  } catch (e) {
    const err = e as Error;
    // Let Vite fix the stack trace so it points to your .ts files
    if (req.vite) {
      req.vite.ssrFixStacktrace(err);
    }
    next(err);
  }
};
