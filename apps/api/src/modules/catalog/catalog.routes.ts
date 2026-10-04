import { Router } from 'express';
export const catalogRouter = Router();
catalogRouter.get('/', (req, res) => res.json({ products: [] }));
