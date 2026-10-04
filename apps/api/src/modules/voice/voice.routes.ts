import { Router } from 'express';
export const voiceRouter = Router();
voiceRouter.post('/process', (_req, res) => {
  res.json({ success: true, items: [] });
});
