import { Request, Response, NextFunction } from 'express';
import { buildHtmlPage } from '../utils.js';
import { PageModel } from '../../shared/models/page.js';

export const ssrMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
};
