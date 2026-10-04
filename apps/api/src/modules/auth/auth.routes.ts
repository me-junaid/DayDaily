import { Router } from 'express';
export const authRouter = Router();
authRouter.post('/request-otp', (_req, res) => {
  res.json({ success: true });
});
authRouter.post('/verify-otp', (_req, res) => {
  res.json({ success: true });
});
