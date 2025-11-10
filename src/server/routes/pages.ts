import express from 'express';
import { UserProfilePage } from '../../shared/models/page.js';
import { routes } from '@/shared/config/routes.js';

export const pagesRouter = express.Router();

pagesRouter.get(routes.userProfile, async (req, res) => {
  const userId = req.params.id;
  const userProfile = await req.bff.getUserProfile(userId);

  res.renderPage({ $type: 'UserProfilePage', ...userProfile } as UserProfilePage);
});
