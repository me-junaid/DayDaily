import { Router } from 'express';
import { storesService } from './stores.service';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  CreateStoreSchema,
  UpdateStoreSchema,
  StoreQuerySchema,
  type CreateStoreInput,
  type UpdateStoreInput,
  type StoreQueryInput,
} from '@daydaily/shared';

export const storesRouter = Router();

// GET /api/stores - Public list of approved/open stores by pincode/town
storesRouter.get('/', validateQuery(StoreQuerySchema), async (req, res, next) => {
  try {
    const query = req.query as StoreQueryInput;
    const stores = await storesService.listStores(query);
    res.json({ stores, count: stores.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/stores/:id - Get specific store details
storesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const store = await storesService.getStoreById(id);
    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    res.json({ store });
  } catch (err) {
    next(err);
  }
});

// POST /api/stores - Admin create store
storesRouter.post('/', validateBody(CreateStoreSchema), async (req, res, next) => {
  try {
    const data = req.body as CreateStoreInput;
    const store = await storesService.createStore(data);
    res.status(201).json({ store });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/stores/:id - Admin update store / toggle open
storesRouter.patch('/:id', validateBody(UpdateStoreSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const data = req.body as UpdateStoreInput;
    const store = await storesService.updateStore(id, data);
    res.json({ store });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/stores/:id - Admin remove store
storesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await storesService.deleteStore(id);
    res.json({ success: true, message: 'Store removed successfully' });
  } catch (err) {
    next(err);
  }
});
