import { Capabilities, Capability } from './capabilities';

export const RoleCapabilities: Record<string, Capability[]> = {
  CUSTOMER: [],
  STORE_OWNER: [Capabilities.VIEW_ORDERS, Capabilities.MANAGE_ORDERS, Capabilities.MANAGE_INVENTORY],
  STORE_STAFF: [Capabilities.VIEW_ORDERS, Capabilities.MANAGE_ORDERS],
  ADMIN: Object.values(Capabilities),
};
