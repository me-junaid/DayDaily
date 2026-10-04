import { Router } from 'express';
export const voiceRouter = Router();
voiceRouter.post('/process', (req, res) => res.json({ success: true, items: [] }));
