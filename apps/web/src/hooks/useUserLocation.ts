import { useState, useEffect } from 'react';
import type { Store } from '@daydaily/shared';
import { fetchStores } from '../lib/api';

export type StoreLocation = Store;

// Seed stores for Engapuzha partner kiranas
export const INITIAL_ADMIN_STORES: StoreLocation[] = [
  {
    id: 'engapuzha-store-1',
    name: 'Engapuzha Town Kirana & Provisions',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110001',
    address: 'Near Main Bus Stand, NH 766, Engapuzha',
    isOpen: true,
  },
  {
    id: 'engapuzha-store-2',
    name: 'Puduppadi Super Daily Store',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110002',
    address: 'Kaithapoyil Junction, Engapuzha',
    isOpen: true,
  },
  {
    id: 'engapuzha-store-3',
    name: 'Malabar Kirana & General Store',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110003',
    address: 'Town Masjid Road, Engapuzha',
    isOpen: true,
  },
  {
    id: 'engapuzha-store-4',
    name: 'Kakkad Daily Needs Kirana',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110004',
    address: 'Old Bazaar Road, Engapuzha',
    isOpen: true,
  },
  {
    id: 'engapuzha-store-5',
    name: 'Wayanad Highway Kirana Bazaar',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110005',
    address: 'Near HP Fuel Station, Engapuzha',
    isOpen: true,
  },
];

export function useUserLocation() {
  const [currentStore, setCurrentStore] = useState<StoreLocation | null>(() => {
    const saved = localStorage.getItem('daydaily_store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.name && parsed?.isOpen !== false) {
          return {
            id: parsed.id || 'saved-store',
            name: parsed.name,
            town: parsed.town || '',
            pincode: parsed.pincode || '',
            phone: parsed.phone || '',
            address: parsed.address || '',
            isOpen: parsed.isOpen ?? true,
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [discoveredStores, setDiscoveredStores] = useState<StoreLocation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentStore && currentStore.isOpen) {
      localStorage.setItem('daydaily_store', JSON.stringify(currentStore));
    } else {
      localStorage.removeItem('daydaily_store');
    }
  }, [currentStore]);

  const selectStore = (store: StoreLocation) => {
    setCurrentStore(store);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          const town =
            addr.village ||
            addr.hamlet ||
            addr.neighbourhood ||
            addr.suburb ||
            addr.town ||
            addr.city ||
            '';

          const postcode = addr.postcode || '';
          const locationLabel = town || (postcode ? `PIN ${postcode}` : 'your current location');
          setSearchedQuery(locationLabel);

          // Query Backend for admin-listed stores in this area / pincode
          let stores: StoreLocation[] = [];
          try {
            stores = await fetchStores({ pincode: postcode || undefined, town: town || undefined, isOpen: true });
          } catch {
            // Fallback to local admin stores filter
            stores = INITIAL_ADMIN_STORES.filter(
              (s) => (postcode && s.pincode === postcode) || (town && s.town.toLowerCase().includes(town.toLowerCase()))
            );
          }

          if (stores.length > 0) {
            setDiscoveredStores(stores);
            setCurrentStore(stores[0]);
          } else {
            // NON-SERVICEABLE LOCATION
            setDiscoveredStores([]);
            setCurrentStore(null);
          }
        } catch {
          setSearchedQuery('Detected Area');
          setDiscoveredStores([]);
          setCurrentStore(null);
          setError('Could not resolve your area. Please enter your 6-digit pincode.');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Please enter town/pincode below.');
        } else {
          setError('Could not get GPS location. Please enter town/pincode.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const searchLocation = async (query: string): Promise<StoreLocation[] | null> => {
    if (!query.trim()) return null;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    const trimmed = query.trim();
    setSearchedQuery(trimmed);
    const isPin = /^\d{6}$/.test(trimmed);

    try {
      // 1. Query backend API for admin stores
      let stores: StoreLocation[] = [];
      try {
        if (isPin) {
          stores = await fetchStores({ pincode: trimmed, isOpen: true });
        } else {
          stores = await fetchStores({ query: trimmed, isOpen: true });
        }
      } catch {
        // Fallback filter over initial admin list
        stores = INITIAL_ADMIN_STORES.filter(
          (s) =>
            (isPin && s.pincode === trimmed) ||
            s.town.toLowerCase().includes(trimmed.toLowerCase()) ||
            s.name.toLowerCase().includes(trimmed.toLowerCase())
        );
      }

      if (stores.length > 0) {
        setDiscoveredStores(stores);
        setCurrentStore(stores[0]);
        setIsLoading(false);
        return stores;
      }

      // No registered stores found for this search (Non-serviceable)
      setDiscoveredStores([]);
      setCurrentStore(null);
      setIsLoading(false);
      return null;
    } catch {
      setError('Network error while searching store.');
      setDiscoveredStores([]);
      setCurrentStore(null);
      setIsLoading(false);
      return null;
    }
  };

  return {
    currentStore,
    discoveredStores,
    hasSearched,
    searchedQuery,
    isLoading,
    error,
    selectStore,
    detectLocation,
    searchLocation,
  };
}
