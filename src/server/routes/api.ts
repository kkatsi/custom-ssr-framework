import express from 'express';
import { UserProfilePage } from '../../shared/models/page.js';
import { routes } from '../../shared/models/routes.js';

export const apiRouter = express.Router();

apiRouter.get(routes.userProfile, async (req, res) => {
  const userId = req.params.id;
  const userProfile = await req.bff.getUserProfile(userId);

  res.json({ $type: 'UserProfilePage', ...userProfile });
});
