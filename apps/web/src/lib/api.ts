import type { Store, StoreQueryInput } from '@daydaily/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchStores(query?: StoreQueryInput): Promise<Store[]> {
  const params = new URLSearchParams();
  if (query?.pincode) params.append('pincode', query.pincode);
  if (query?.town) params.append('town', query.town);
  if (query?.query) params.append('query', query.query);
  if (typeof query?.isOpen === 'boolean') params.append('isOpen', String(query.isOpen));

  const url = `${API_BASE_URL}/api/stores${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.stores || []) as Store[];
}
