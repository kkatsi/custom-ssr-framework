import { routes } from '@/shared/config/routes.js';
import express from 'express';

export const apiRouter = express.Router();

apiRouter.get(routes.userProfile, async (req, res) => {
  const userId = req.params.id;
  const userProfile = await req.bff.getUserProfile(userId);

  res.json({ $type: 'UserProfilePage', ...userProfile });
});
