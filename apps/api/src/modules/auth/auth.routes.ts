import { Router } from 'express';
export const authRouter = Router();
authRouter.post('/request-otp', (req, res) => res.json({ success: true }));
authRouter.post('/verify-otp', (req, res) => res.json({ success: true }));
