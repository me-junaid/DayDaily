export const Capabilities = {
  VIEW_ORDERS: 'orders:view',
  MANAGE_ORDERS: 'orders:manage',
  MANAGE_INVENTORY: 'inventory:manage',
  MANAGE_STORES: 'stores:manage',
  VIEW_ADMIN_ANALYTICS: 'analytics:view_admin',
} as const;

export type Capability = (typeof Capabilities)[keyof typeof Capabilities];
