import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Plus,
  Minus,
  MapPin,
  MapPinOff,
  Sparkles,
  Keyboard,
  User,
  Clock,
  ShoppingBag,
  Navigation,
  ChevronDown,
  X,
  Loader2,
  Store,
  Search,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { useUserLocation } from '../hooks';

export interface ProductVariant {
  size: string; // e.g. '500 ml', '1 L', '2 L' or '1 kg', '5 kg'
  pricePaise: number;
}

export interface UsualItem {
  id: string;
  name: string; // Base name e.g. "Milk", "Atta"
  category: string;
  imageUrl?: string;
  brands?: string[];
  defaultBrand?: string;
  variants?: ProductVariant[];
  unit: string;
  pricePaise: number;
}

export interface ProductCustomization {
  brand?: string;
  size: string;
  pricePaise: number;
}

export interface CartItemEntry {
  key: string;
  itemId: string;
  name: string;
  brand?: string;
  size: string;
  pricePaise: number;
  category: string;
  imageUrl?: string;
}

const USUAL_ITEMS: UsualItem[] = [
  {
    id: 'milk',
    name: 'Milk',
    category: 'Dairy',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    brands: ['Amul Taaza', 'Milma Smart', 'Nandini Blue', 'Mother Dairy'],
    defaultBrand: 'Amul Taaza',
    variants: [
      { size: '500 ml', pricePaise: 2800 },
      { size: '1 L', pricePaise: 5600 },
      { size: '2 L', pricePaise: 11000 },
    ],
    unit: '1 L',
    pricePaise: 5600,
  },
  {
    id: 'atta',
    name: 'Atta',
    category: 'Atta & Rice',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    brands: ['Aashirvaad', 'Pillsbury', 'Fortune', 'Chakki Fresh'],
    defaultBrand: 'Aashirvaad',
    variants: [
      { size: '1 kg', pricePaise: 5200 },
      { size: '5 kg', pricePaise: 24500 },
      { size: '10 kg', pricePaise: 48000 },
    ],
    unit: '5 kg',
    pricePaise: 24500,
  },
  {
    id: 'salt',
    name: 'Salt',
    category: 'Spices',
    imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
    brands: ['Tata Salt', 'Aashirvaad Salt', 'Puro Rock Salt'],
    defaultBrand: 'Tata Salt',
    variants: [
      { size: '500 g', pricePaise: 1600 },
      { size: '1 kg', pricePaise: 2800 },
    ],
    unit: '1 kg',
    pricePaise: 2800,
  },
  {
    id: 'onions',
    name: 'Red Onions',
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    variants: [
      { size: '500 g', pricePaise: 2000 },
      { size: '1 kg', pricePaise: 3800 },
      { size: '2 kg', pricePaise: 7200 },
      { size: '5 kg', pricePaise: 17500 },
    ],
    unit: '1 kg',
    pricePaise: 3800,
  },
  {
    id: 'oil',
    name: 'Sunflower Oil',
    category: 'Daily',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    brands: ['Fortune', 'Sunpure', 'Gold Winner', 'Saffola Gold'],
    defaultBrand: 'Fortune',
    variants: [
      { size: '500 ml', pricePaise: 7200 },
      { size: '1 L', pricePaise: 13500 },
      { size: '5 L', pricePaise: 66000 },
    ],
    unit: '1 L',
    pricePaise: 13500,
  },
  {
    id: 'sugar',
    name: 'Sugar',
    category: 'Daily',
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
    brands: ['Madhur Pure', 'Trust Classic', 'Loose Kirana'],
    defaultBrand: 'Madhur Pure',
    variants: [
      { size: '500 g', pricePaise: 2400 },
      { size: '1 kg', pricePaise: 4400 },
      { size: '5 kg', pricePaise: 21500 },
    ],
    unit: '1 kg',
    pricePaise: 4400,
  },
];

const CATEGORIES = ['Selected', 'All', 'Daily', 'Dairy', 'Atta & Rice', 'Vegetables', 'Spices'];

export function Home() {
  const {
    currentStore,
    discoveredStores,
    hasSearched,
    searchedQuery,
    isLoading: isLocating,
    error: locationError,
    selectStore,
    detectLocation,
    searchLocation,
  } = useUserLocation();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartItemsMap, setCartItemsMap] = useState<Record<string, CartItemEntry>>({});
  const [speakState, setSpeakState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typeText, setTypeText] = useState('');

  // Item customization active preferences
  const [customizations, setCustomizations] = useState<Record<string, ProductCustomization>>(() => {
    const initial: Record<string, ProductCustomization> = {};
    for (const item of USUAL_ITEMS) {
      initial[item.id] = {
        brand: item.defaultBrand || (item.brands ? item.brands[0] : undefined),
        size: item.unit,
        pricePaise: item.pricePaise,
      };
    }
    return initial;
  });

  // Modal for customizing brand/quantity
  const [customizingItem, setCustomizingItem] = useState<UsualItem | null>(null);
  const [modalSelectedBrand, setModalSelectedBrand] = useState<string | undefined>(undefined);
  const [modalSelectedSize, setModalSelectedSize] = useState<string>('');
  const [modalSelectedPrice, setModalSelectedPrice] = useState<number>(0);

  const isServiceable = Boolean(currentStore && currentStore.isOpen);

  useEffect(() => {
    if (!isServiceable) {
      setCartQuantities({});
      setCartItemsMap({});
    }
  }, [isServiceable]);

  const toggleVoiceRecording = () => {
    if (!isServiceable) {
      setIsLocationModalOpen(true);
      return;
    }

    if (speakState === 'idle') {
      setSpeakState('recording');
    } else if (speakState === 'recording') {
      setSpeakState('processing');
      setTimeout(() => {
        setSpeakState('idle');
      }, 2000);
    }
  };

  const getCustomKey = (itemId: string, brand?: string, size?: string) => {
    return `${itemId}_${brand || 'standard'}_${size || 'standard'}`;
  };

  const getItemDisplayName = (item: UsualItem, brand?: string) => {
    if (!brand) return item.name;
    const b = brand.toLowerCase();
    const n = item.name.toLowerCase();
    if (b.includes(n) || n.includes(b)) {
      return brand;
    }
    return `${brand} ${item.name}`;
  };

  const openCustomizer = (item: UsualItem) => {
    const current = customizations[item.id] || {
      brand: item.defaultBrand,
      size: item.unit,
      pricePaise: item.pricePaise,
    };
    setCustomizingItem(item);
    setModalSelectedBrand(current.brand);
    setModalSelectedSize(current.size);
    setModalSelectedPrice(current.pricePaise);
  };

  const applyCustomization = () => {
    if (!customizingItem) return;
    setCustomizations((prev) => ({
      ...prev,
      [customizingItem.id]: {
        brand: modalSelectedBrand,
        size: modalSelectedSize,
        pricePaise: modalSelectedPrice,
      },
    }));
    setCustomizingItem(null);
  };

  const handleAddItem = (
    item: UsualItem,
    customOverride?: { brand?: string; size: string; pricePaise: number }
  ) => {
    if (!isServiceable) {
      setIsLocationModalOpen(true);
      return;
    }

    const custom =
      customOverride ||
      customizations[item.id] || {
        brand: item.defaultBrand,
        size: item.unit,
        pricePaise: item.pricePaise,
      };

    const key = getCustomKey(item.id, custom.brand, custom.size);

    setCartItemsMap((prev) => ({
      ...prev,
      [key]: {
        key,
        itemId: item.id,
        name: item.name,
        brand: custom.brand,
        size: custom.size,
        pricePaise: custom.pricePaise,
        category: item.category,
        imageUrl: item.imageUrl,
      },
    }));

    setCartQuantities((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const handleRemoveItem = (key: string) => {
    setCartQuantities((prev) => {
      const current = prev[key] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: current - 1 };
    });
  };

  const totalItemsInCart = Object.values(cartQuantities).reduce((sum, count) => sum + count, 0);

  const selectedCartItems = Object.keys(cartQuantities)
    .filter((key) => (cartQuantities[key] || 0) > 0)
    .map((key) => cartItemsMap[key])
    .filter(Boolean);

  const filteredItems =
    selectedCategory === 'Selected'
      ? []
      : selectedCategory === 'All'
      ? USUAL_ITEMS
      : USUAL_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-bg text-ink flex justify-center selection:bg-surface-2">
      <div className="w-full max-w-md min-h-screen flex flex-col px-4 pt-[76px] pb-44">
        {/* Fixed Top Header */}
        <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-30 bg-bg px-4 pt-4 pb-3 border-b border-line flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">DayDaily</h1>
            {/* Interactive Location & Store Badge */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              aria-label="Change store location"
              className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink mt-0.5 transition-colors group cursor-pointer text-left"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 text-ink animate-spin" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-ink-2 group-hover:text-ink transition-colors" />
              )}
              <span className="font-medium max-w-[170px] truncate underline decoration-line underline-offset-2">
                {currentStore?.name || 'Choose your location'}
              </span>
              {currentStore?.name && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-success shrink-0"></span>
              )}
              <ChevronDown className="w-3 h-3 text-ink-3 group-hover:text-ink transition-colors shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/history"
              className="h-9 px-3 bg-surface hover:bg-surface-2 text-ink text-xs font-medium rounded-r-full flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-ink-2" />
              <span>Orders</span>
            </Link>
            <Link
              to="/login"
              aria-label="Account Login"
              className="h-9 w-9 bg-surface hover:bg-surface-2 text-ink rounded-r-full flex items-center justify-center transition-colors"
            >
              <User className="w-4 h-4 text-ink" />
            </Link>
          </div>
        </header>

        {/* Serviceable Location Prompt Banner if not selected */}
        {!isServiceable && (
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="mt-3 p-3 bg-surface hover:bg-surface-2 rounded-r-md border border-line flex items-center justify-between transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-r-full bg-ink text-white flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Choose your delivery location</p>
                <p className="text-[11px] text-ink-2">Select a serviceable store to enable ordering</p>
              </div>
            </div>
            <span className="text-xs font-medium text-ink underline shrink-0 ml-2 group-hover:no-underline">
              Set Location
            </span>
          </button>
        )}

        {/* Voice Ordering Suggestion Card */}
        <div className="mt-4 p-4 bg-surface rounded-r-md border border-line/50">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-2 mb-1">
            <Sparkles className="w-4 h-4 text-ink" />
            <span>Try speaking like this:</span>
          </div>
          <p className="text-sm font-medium text-ink italic">
            &ldquo;2 kg Aashirvaad atta, 1 litre Amul milk, and 1 kg sugar&rdquo;
          </p>
        </div>

        {/* Categories Chips */}
        <div className="mt-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((category) => {
              const isSelectedTab = category === 'Selected';
              const label =
                isSelectedTab && totalItemsInCart > 0
                  ? `Selected (${totalItemsInCart})`
                  : category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`h-10 px-4 rounded-r-full text-sm whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                    selectedCategory === category
                      ? 'bg-ink text-white font-medium'
                      : 'bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {isSelectedTab && totalItemsInCart > 0 && (
                    <span className={`w-2 h-2 rounded-full ${selectedCategory === 'Selected' ? 'bg-white' : 'bg-ink'}`} />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Your Usuals / Selected Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-ink">
              {selectedCategory === 'Selected' ? 'Selected items' : 'Your usuals'}
            </h3>
            <span className="text-xs text-ink-2">
              {selectedCategory === 'Selected' ? `${totalItemsInCart} in cart` : 'Tap to customize'}
            </span>
          </div>

          {selectedCategory === 'Selected' ? (
            /* Selected Items View */
            selectedCartItems.length === 0 ? (
              <div className="bg-surface rounded-r-md p-6 text-center border border-line flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="w-8 h-8 text-ink-3" />
                <p className="text-sm font-medium text-ink">No items selected yet</p>
                <p className="text-xs text-ink-2 max-w-[240px]">
                  Tap &ldquo;Add&rdquo; on items or speak your grocery list below.
                </p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="mt-2 text-xs font-medium text-ink underline"
                >
                  Browse All Items
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {selectedCartItems.map((entry) => {
                  const count = cartQuantities[entry.key] || 0;
                  const item = USUAL_ITEMS.find((u) => u.id === entry.itemId) || {
                    id: entry.itemId,
                    name: entry.name,
                    category: entry.category,
                    imageUrl: entry.imageUrl,
                    unit: entry.size,
                    pricePaise: entry.pricePaise,
                  };

                  return (
                    <div
                      key={entry.key}
                      className="bg-surface rounded-r-md p-3.5 flex flex-col justify-between hover:bg-surface-2 transition-colors min-h-[136px] relative"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-medium text-sm text-ink line-clamp-2 leading-tight flex-1">
                            {getItemDisplayName(item, entry.brand)}
                          </h4>
                          <span className="px-2 py-0.5 text-[11px] font-medium bg-white border border-line text-ink rounded-r-full shrink-0 shadow-2xs">
                            {entry.size}
                          </span>
                        </div>
                        <p className="text-xs text-ink-2 mt-1">
                          {entry.brand ? `${entry.brand} • ` : ''}{entry.size}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/60">
                        <span className="text-sm font-semibold text-ink">
                          ₹{(entry.pricePaise / 100).toFixed(0)}
                        </span>

                        <div className="flex items-center bg-white rounded-r-full border border-line shadow-xs">
                          <button
                            onClick={() => handleRemoveItem(entry.key)}
                            aria-label={`Decrease ${entry.name}`}
                            className="h-8 w-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-r-full transition-colors active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold text-ink px-1 min-w-[16px] text-center">
                            {count}
                          </span>
                          <button
                            onClick={() => handleAddItem(item, entry)}
                            aria-label={`Increase ${entry.name}`}
                            className="h-8 w-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-r-full transition-colors active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : filteredItems.length === 0 ? (
            <div className="bg-surface rounded-r-md p-6 text-center border border-line flex flex-col items-center justify-center gap-2">
              <ShoppingBag className="w-8 h-8 text-ink-3" />
              <p className="text-sm font-medium text-ink">No items found</p>
            </div>
          ) : (
            /* Clean Minimal Product Cards Grid */
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const custom = customizations[item.id] || {
                  brand: item.defaultBrand,
                  size: item.unit,
                  pricePaise: item.pricePaise,
                };
                const key = getCustomKey(item.id, custom.brand, custom.size);
                const count = cartQuantities[key] || 0;
                const hasOptions = (item.variants && item.variants.length > 1) || (item.brands && item.brands.length > 1);

                return (
                  <div
                    key={item.id}
                    className="bg-surface rounded-r-md p-3.5 flex flex-col justify-between hover:bg-surface-2 transition-colors min-h-[136px] relative"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-medium text-sm text-ink line-clamp-2 leading-tight flex-1">
                          {getItemDisplayName(item, custom.brand)}
                        </h4>

                        {/* Top-Right Customization Icon Button */}
                        {hasOptions && (
                          <button
                            onClick={() => openCustomizer(item)}
                            title={`Customize ${item.name} brand & size`}
                            aria-label={`Customize ${item.name}`}
                            className="w-7 h-7 rounded-r-full bg-white hover:bg-surface-2 border border-line text-ink flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-ink" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-ink-2 mt-1">
                        {custom.brand ? `${custom.brand} • ` : ''}{custom.size}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/60">
                      <span className="text-sm font-semibold text-ink">
                        ₹{(custom.pricePaise / 100).toFixed(0)}
                      </span>

                      {count > 0 ? (
                        <div className="flex items-center bg-white rounded-r-full border border-line shadow-xs">
                          <button
                            onClick={() => handleRemoveItem(key)}
                            aria-label={`Decrease ${item.name}`}
                            className="h-8 w-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-r-full transition-colors active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold text-ink px-1 min-w-[16px] text-center">
                            {count}
                          </span>
                          <button
                            onClick={() => handleAddItem(item)}
                            aria-label={`Increase ${item.name}`}
                            className="h-8 w-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-r-full transition-colors active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddItem(item)}
                          aria-label={`Add ${item.name}`}
                          className="h-8 px-3 rounded-r-full text-xs font-medium flex items-center justify-center gap-1 bg-white text-ink border border-line hover:border-ink/20 shadow-xs transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Speak / Type Dock (Hero Component - Fixed Bottom) */}
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40">
          <div className="bg-white rounded-[30px] shadow-dock border border-line p-3 flex flex-col items-center gap-2">
            {showTypeInput ? (
              /* Type Input Field in place of Speak button */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isServiceable) {
                    setIsLocationModalOpen(true);
                    return;
                  }
                  if (typeText.trim()) {
                    setTypeText('');
                    setShowTypeInput(false);
                  }
                }}
                className="w-full flex items-center gap-2"
              >
                <input
                  type="text"
                  autoFocus
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  placeholder="e.g. 2 kg atta, 1 L milk, 1 kg sugar..."
                  className="flex-1 h-14 px-4 bg-surface rounded-[20px] text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-ink"
                />
                <button
                  type="submit"
                  disabled={!typeText.trim()}
                  className="h-14 px-5 bg-ink disabled:opacity-40 text-white rounded-[20px] font-medium text-sm flex items-center justify-center transition-all active:scale-95 shrink-0"
                >
                  Add
                </button>
              </form>
            ) : (
              /* Primary Speak Button */
              <button
                onClick={toggleVoiceRecording}
                aria-label="Speak your grocery list"
                className={`w-full h-14 rounded-[20px] font-medium text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  speakState === 'recording'
                    ? 'bg-ink text-white ring-4 ring-rec/20'
                    : speakState === 'processing'
                    ? 'bg-ink text-white'
                    : 'bg-ink text-white hover:opacity-95'
                }`}
              >
                {speakState === 'idle' && (
                  <>
                    <Mic className="w-6 h-6 text-white" />
                    <span>Speak</span>
                  </>
                )}

                {speakState === 'recording' && (
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-rec animate-pulse"></span>
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-4 bg-rec animate-bounce rounded-full"></span>
                      <span className="w-1 h-6 bg-rec animate-bounce rounded-full [animation-delay:0.15s]"></span>
                      <span className="w-1 h-3 bg-rec animate-bounce rounded-full [animation-delay:0.3s]"></span>
                      <span className="w-1 h-5 bg-rec animate-bounce rounded-full [animation-delay:0.45s]"></span>
                    </div>
                    <span className="text-sm font-medium">Listening... tap to stop</span>
                  </div>
                )}

                {speakState === 'processing' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>Understanding your order...</span>
                  </div>
                )}
              </button>
            )}

            {/* Dock Footer Text & Toggle fallback */}
            <div className="flex items-center justify-between w-full px-3 pt-0.5">
              <span className="text-xs text-ink-2">
                {!isServiceable
                  ? 'Choose location to start ordering'
                  : showTypeInput
                  ? 'Type items with quantity'
                  : speakState === 'recording'
                  ? 'Say items with quantity'
                  : 'Tap and say what you need'}
              </span>

              {showTypeInput ? (
                <button
                  type="button"
                  onClick={() => setShowTypeInput(false)}
                  className="text-xs text-ink-2 hover:text-ink underline flex items-center gap-1"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak instead</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTypeInput(true)}
                  className="text-xs text-ink-2 hover:text-ink underline flex items-center gap-1"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Type instead</span>
                </button>
              )}
            </div>
          </div>

          {totalItemsInCart > 0 && (
            <div className="mt-2 text-center">
              <span className="inline-block bg-surface px-3 py-1 rounded-r-full text-xs font-medium text-ink border border-line">
                {totalItemsInCart} {totalItemsInCart === 1 ? 'item' : 'items'} selected
              </span>
            </div>
          )}
        </div>

        {/* Product Customization Bottom Sheet Modal */}
        {customizingItem && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setCustomizingItem(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-r-md p-5 shadow-sheet border border-line max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="font-semibold text-base text-ink">
                    Customize {customizingItem.name}
                  </h3>
                  <p className="text-xs text-ink-2">Select your preferred brand and quantity</p>
                </div>
                <button
                  onClick={() => setCustomizingItem(null)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-r-full bg-surface hover:bg-surface-2 flex items-center justify-center text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar py-4 space-y-5">
                {/* Image on top of Customizer */}
                {customizingItem.imageUrl && (
                  <div className="w-full h-36 bg-surface rounded-r-md overflow-hidden border border-line/50 flex items-center justify-center relative">
                    <img
                      src={customizingItem.imageUrl}
                      alt={customizingItem.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3">
                      <p className="text-white text-xs font-medium">
                        {modalSelectedBrand ? `${modalSelectedBrand} • ` : ''}{modalSelectedSize}
                      </p>
                    </div>
                  </div>
                )}

                {/* Brand Selection */}
                {customizingItem.brands && customizingItem.brands.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider block mb-2 px-1">
                      Choose Brand
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {customizingItem.brands.map((brand) => {
                        const isSelected = modalSelectedBrand === brand;
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setModalSelectedBrand(brand)}
                            className={`h-10 px-4 rounded-r-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-ink text-white border-ink shadow-xs'
                                : 'bg-surface text-ink border-line hover:bg-surface-2'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            <span>{brand}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity / Pack Size Selection */}
                {customizingItem.variants && customizingItem.variants.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider block mb-2 px-1">
                      Choose Quantity / Size
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {customizingItem.variants.map((variant) => {
                        const isSelected = modalSelectedSize === variant.size;
                        return (
                          <div
                            key={variant.size}
                            onClick={() => {
                              setModalSelectedSize(variant.size);
                              setModalSelectedPrice(variant.pricePaise);
                            }}
                            className={`p-3 rounded-r-md border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-surface-2 border-ink shadow-xs'
                                : 'bg-surface border-line hover:bg-surface-2'
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-sm text-ink">{variant.size}</p>
                              <p className="text-xs font-medium text-ink-2 mt-0.5">
                                ₹{(variant.pricePaise / 100).toFixed(0)}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-r-full bg-ink text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Summary & Actions */}
              <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider">Selected option</p>
                  <p className="text-xs font-semibold text-ink truncate">
                    {modalSelectedBrand ? `${modalSelectedBrand} · ` : ''}{modalSelectedSize}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={applyCustomization}
                    className="h-11 px-4 bg-surface hover:bg-surface-2 text-ink border border-line rounded-r-full text-xs font-medium flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span>Apply</span>
                    <span className="text-ink-2">(₹{(modalSelectedPrice / 100).toFixed(0)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!customizingItem) return;
                      setCustomizations((prev) => ({
                        ...prev,
                        [customizingItem.id]: {
                          brand: modalSelectedBrand,
                          size: modalSelectedSize,
                          pricePaise: modalSelectedPrice,
                        },
                      }));
                      handleAddItem(customizingItem, {
                        brand: modalSelectedBrand,
                        size: modalSelectedSize,
                        pricePaise: modalSelectedPrice,
                      });
                      setCustomizingItem(null);
                    }}
                    className="h-11 px-5 bg-ink text-white rounded-r-full text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location & Store Selector Bottom Sheet Modal */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
            <div
              className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-r-md p-5 shadow-sheet border border-line max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-ink" />
                  <h3 className="font-semibold text-base text-ink">Choose your store</h3>
                </div>
                <button
                  onClick={() => setIsLocationModalOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-r-full bg-surface hover:bg-surface-2 flex items-center justify-center text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar py-4 space-y-4">
                {/* Auto Detect GPS Button */}
                <div>
                  <button
                    onClick={() => {
                      detectLocation();
                    }}
                    disabled={isLocating}
                    className="w-full h-12 bg-ink text-white rounded-r-full font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Finding nearest store...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>
                  {locationError && (
                    <p className="text-xs text-danger mt-1.5 text-center">{locationError}</p>
                  )}
                </div>

                {/* Or Search by Pincode / Town */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-px flex-1 bg-line"></span>
                    <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                      Or enter town / pincode
                    </span>
                    <span className="h-px flex-1 bg-line"></span>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (locationSearchInput.trim()) {
                        await searchLocation(locationSearchInput);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={locationSearchInput}
                        onChange={(e) => setLocationSearchInput(e.target.value)}
                        placeholder="e.g. 673001, Gudalur, Pandalur..."
                        className="w-full h-11 pl-9 pr-3 text-xs bg-surface rounded-r-sm border border-line focus:outline-none focus:ring-2 focus:ring-ink"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLocating || !locationSearchInput.trim()}
                      className="h-11 px-4 bg-ink text-white rounded-r-sm text-xs font-medium disabled:opacity-40 active:scale-95 transition-all shrink-0"
                    >
                      {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                    </button>
                  </form>
                </div>

                {/* Discovered Stores List (Only shown once searched or GPS detected) */}
                {discoveredStores.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
                        Stores Found in Area ({discoveredStores.length})
                      </span>
                      <span className="text-xs text-ink-3">Available Now</span>
                    </div>

                    <div className="space-y-2">
                      {discoveredStores.map((store) => {
                        const isSelected = Boolean(
                          currentStore && (store.id === currentStore.id || store.name === currentStore.name)
                        );
                        return (
                          <div
                            key={store.id || store.name}
                            onClick={() => {
                              selectStore(store);
                              setIsLocationModalOpen(false);
                            }}
                            className={`p-3.5 rounded-r-md transition-all cursor-pointer flex items-center justify-between border ${
                              isSelected
                                ? 'bg-surface-2 border-ink shadow-xs'
                                : 'bg-surface border-line/40 hover:bg-surface-2'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-r-full flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-ink text-white'
                                    : 'bg-surface-2 text-ink-2'
                                }`}
                              >
                                <Store className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-ink leading-snug">
                                  {store.name}
                                </h4>
                                <p className="text-xs text-ink-2 mt-0.5">
                                  {store.address || store.town} {store.pincode ? `• PIN: ${store.pincode}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-white px-2 py-0.5 rounded-r-full border border-line">
                                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                                Open
                              </span>
                              {isSelected && (
                                <span className="text-[11px] font-semibold text-ink">Active</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : hasSearched && !isLocating ? (
                  <div className="p-5 bg-surface rounded-r-md text-center border border-line flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-r-full bg-warn/10 flex items-center justify-center mb-0.5">
                      <MapPinOff className="w-5 h-5 text-warn" />
                    </div>
                    <h4 className="text-sm font-semibold text-ink">Non-serviceable location</h4>
                    <p className="text-xs text-ink-2 max-w-[280px] leading-relaxed">
                      {searchedQuery
                        ? `We do not have a partner kirana store delivering in "${searchedQuery}" yet.`
                        : 'We do not have a partner kirana store in this area yet.'}
                    </p>
                    <p className="text-[11px] text-ink-3">
                      DayDaily is expanding town-by-town. Please try a nearby town or pincode.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-surface rounded-r-md text-center border border-line/60">
                    <p className="text-xs text-ink-2">
                      Tap <strong>GPS</strong> or enter your <strong>6-digit PIN code / town</strong> above to find partner kirana stores fulfilling in your locality.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer Note */}
              <div className="pt-3 border-t border-line text-center">
                <p className="text-xs text-ink-3">
                  Orders will be packed and fulfilled by the selected kirana store.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
