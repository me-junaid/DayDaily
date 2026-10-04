import { prisma } from '../../lib/prisma';
import type { CreateStoreInput, UpdateStoreInput, StoreQueryInput } from '@daydaily/shared';

export class StoresService {
  async listStores(query?: StoreQueryInput) {
    const where: {
      pincode?: string;
      town?: { contains: string; mode: 'insensitive' };
      isOpen?: boolean;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        town?: { contains: string; mode: 'insensitive' };
        address?: { contains: string; mode: 'insensitive' };
        pincode?: { contains: string };
      }>;
    } = {};

    if (query?.pincode) {
      where.pincode = query.pincode;
    }

    if (query?.town) {
      where.town = { contains: query.town, mode: 'insensitive' };
    }

    if (typeof query?.isOpen === 'boolean') {
      where.isOpen = query.isOpen;
    }

    if (query?.query) {
      const q = query.query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { town: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { pincode: { contains: q } },
      ];
    }

    return prisma.store.findMany({
      where,
      orderBy: [{ isOpen: 'desc' }, { name: 'asc' }],
    });
  }

  async getStoreById(id: string) {
    return prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });
  }

  async createStore(data: CreateStoreInput) {
    return prisma.store.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        town: data.town,
        pincode: data.pincode,
        isOpen: data.isOpen ?? true,
      },
    });
  }

  async updateStore(id: string, data: UpdateStoreInput) {
    return prisma.store.update({
      where: { id },
      data,
    });
  }

  async deleteStore(id: string) {
    return prisma.store.delete({
      where: { id },
    });
  }
}

export const storesService = new StoresService();
