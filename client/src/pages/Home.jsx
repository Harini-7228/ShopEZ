import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Pagination, Spinner, Form } from 'react-bootstrap';
import { getProducts } from '../api/productsApi';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'discount', label: 'Best Discount' },
  { value: 'name_asc', label: 'Name: A → Z' },
];

const PRICE_RANGES = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹1,999', min: '500', max: '1999' },
  { label: '₹2,000 – ₹9,999', min: '2000', max: '9999' },
  { label: '₹10,000+', min: '10000', max: '' },
];

/* ── Small dropdown pill used in the horizontal bar ── */
const FilterDropdown = ({ label, icon, active, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="position-relative" style={{ display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`btn btn-sm d-flex align-items-center gap-1 px-3 py-1 border rounded-2 ${active ? 'btn-primary text-white' : 'btn-light text-dark border-secondary'}`}
        style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}
      >
        {icon && <span>{icon}</span>}
        {label}
        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
      </button>
      {open && (
        <div className="bg-white border rounded-2 shadow-lg position-absolute mt-1 py-2"
          style={{ zIndex: 1050, minWidth: '185px', top: '100%', left: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
};
const DropdownItem = ({ label, active, onClick }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    className={`btn border-0 w-100 text-start px-3 py-1 small ${active ? 'fw-bold text-primary' : 'text-dark'}`}
    style={{ background: active ? '#f0f4ff' : 'transparent', fontSize: '0.83rem' }}>
    {active ? '✓ ' : ''}{label}
  </button>
);

const CategoryBar = ({ topLevelCategories, activeCategoryBarId, onCategoryClick, getEmoji }) => {
  const scrollerRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

  return (
    <div className="category-scroll-shell mb-2">
      <div
        ref={scrollerRef}
        className="category-scroll-container"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const scrollbarZoneHeight = 18;
          if (e.clientY >= rect.bottom - scrollbarZoneHeight) return;

          dragStateRef.current = {
            active: true,
            startX: e.pageX,
            scrollLeft: e.currentTarget.scrollLeft,
          };
          e.currentTarget.classList.add('is-dragging');
        }}
        onMouseMove={(e) => {
          if (!dragStateRef.current.active) return;
          e.preventDefault();
          e.currentTarget.scrollLeft = dragStateRef.current.scrollLeft - (e.pageX - dragStateRef.current.startX);
        }}
        onMouseUp={(e) => {
          dragStateRef.current.active = false;
          e.currentTarget.classList.remove('is-dragging');
        }}
        onMouseLeave={(e) => {
          dragStateRef.current.active = false;
          e.currentTarget.classList.remove('is-dragging');
        }}
      >
        <div className="category-scroll-track">
          <button
            onClick={() => onCategoryClick('__all__', '')}
            className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-2 shadow-sm category-scroll-item"
            style={{
              background: activeCategoryBarId === '__all__' ? 'var(--primary-terracotta)' : '#ffffff',
              color: activeCategoryBarId === '__all__' ? '#ffffff' : 'var(--text-dark)',
              border: '2px solid',
              borderColor: activeCategoryBarId === '__all__' ? 'var(--primary-terracotta)' : 'var(--border-clay)',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            <span className="fs-5">🛍️</span>
            <span>All Items</span>
          </button>
          {topLevelCategories.map(cat => {
            const isActive = activeCategoryBarId === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => onCategoryClick(cat._id, cat._id)}
                className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-2 shadow-sm category-scroll-item"
                style={{
                  background: isActive ? 'var(--primary-terracotta)' : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--text-dark)',
                  border: '2px solid',
                  borderColor: isActive ? 'var(--primary-terracotta)' : 'var(--border-clay)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span className="fs-5">{getEmoji(cat.name)}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Sidebar section header ── */
const SectionHead = ({ children }) => (
  <p className="text-uppercase fw-bold text-muted mb-2"
    style={{ fontSize: '0.68rem', letterSpacing: '0.07em' }}>
    {children}
  </p>
);

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 16, pages: 1, total: 0 });
  const [flashProducts, setFlashProducts] = useState([]);
  const [flashTimer, setFlashTimer] = useState({ h: 4, m: 34, s: 19 });
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [premiumProducts, setPremiumProducts] = useState([]);

  // Ref for scrolling to product grid when category is selected (logged-in only)
  const productsRef = useRef(null);
  // null = no button highlighted on page load; set only on explicit user click
  const [activeCategoryBarId, setActiveCategoryBarId] = useState(null);

  // Called by CategoryBar buttons — navigates directly to the products search page pre-filtered
  const handleCategoryBarClick = (barId, categoryValue) => {
    if (barId === '__all__') {
      navigate('/products');
      return;
    }
    navigate(`/products?category=${encodeURIComponent(categoryValue)}`);
  };

  const categoryEmojis = {
    groceries: '🍎', fashion: '👕', electronics: '💻', mobiles: '📱',
    toys: '🧸', furniture: '🛋️', sports: '⚽', beauty: '💄', books: '📚',
    kitchen: '🍳', health: '💊', wellness: '💊', gaming: '🎮',
    pet: '🐾', travel: '✈️', baby: '👶', kids: '👶',
    home: '🏠', living: '🏠',
  };
  const getEmoji = (name) => {
    const k = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, e] of Object.entries(categoryEmojis))
      if (k.includes(key) || key.includes(k)) return e;
    return '📦';
  };

  // URL-synced filter state
  const categoryFilter = searchParams.get('category') || '';
  const searchFilter = searchParams.get('search') || '';
  const minPriceFilter = searchParams.get('minPrice') || '';
  const maxPriceFilter = searchParams.get('maxPrice') || '';
  const inStockFilter = searchParams.get('inStock') === 'true';
  const hasDiscountFilter = searchParams.get('hasDiscount') === 'true';
  const featuredFilter = searchParams.get('featuredOnly') === 'true';
  const sortByFilter = searchParams.get('sortBy') || '';

  // Extract specs filters (anything matching specs[key])
  const specFilters = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('specs[')) {
      const specKey = key.match(/specs\[(.*?)\]/)[1];
      specFilters[specKey] = value.split(',').filter(Boolean);
    }
  });

  const hasAnyFilter = categoryFilter || searchFilter || minPriceFilter || maxPriceFilter
    || inStockFilter || hasDiscountFilter || featuredFilter || sortByFilter || Object.keys(specFilters).length > 0;

  // Used to hide Shop by Category only when non-category filters are active (category alone should not hide it)
  const hasNonCategoryFilter = searchFilter || minPriceFilter || maxPriceFilter
    || inStockFilter || hasDiscountFilter || featuredFilter || sortByFilter || Object.keys(specFilters).length > 0;

  // Helpers
  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', '1');
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };
  const setMultiParams = (updates) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', '1');
    Object.entries(updates).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
    setSearchParams(p);
  };
  const toggleParam = (key, checked) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', '1');
    if (checked) p.set(key, 'true'); else p.delete(key);
    setSearchParams(p);
  };
  const toggleSpecFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', '1');
    const current = p.get(`specs[${key}]`);
    let values = current ? current.split(',').filter(Boolean) : [];
    if (values.includes(value)) {
      values = values.filter(v => v !== value);
    } else {
      values.push(value);
    }
    if (values.length > 0) {
      p.set(`specs[${key}]`, values.join(','));
    } else {
      p.delete(`specs[${key}]`);
    }
    setSearchParams(p);
  };
  const clearSpecFilter = (key) => {
    const p = new URLSearchParams(searchParams);
    p.delete(`specs[${key}]`);
    setSearchParams(p);
  };
  const clearAllFilters = () => setSearchParams({});
  const handlePageChange = (n) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', n.toString());
    setSearchParams(p);
  };

  // Hierarchy logic
  const topLevelCategories = categories.filter(c => !c.parentCategory);
  const activeCatObj = categories.find(c => c._id === categoryFilter);
  const activeTopCategoryId = activeCatObj?.parentCategory || categoryFilter;
  const activeSubcategories = categories.filter(c => c.parentCategory === activeTopCategoryId);
  const activeTopCategoryName = categories.find(c => c._id === activeTopCategoryId)?.name;

  const ATTRIBUTE_FILTERS = {
    'Fashion': [
      { key: 'Gender', label: 'GENDER', options: ['Men', 'Women', 'Boys', 'Girls', 'Unisex'] },
      { key: 'Color', label: 'COLOR', options: ['Black', 'White', 'Blue', 'Red', 'Grey', 'Brown', 'Multicolor', 'Pink', 'Gold'] },
      { key: 'Brand', label: 'BRAND', options: ['DressBerry', 'Roadster', 'Puma', 'Anouk'] },
      { key: 'Style', label: 'STYLE', options: ['Casual', 'Formal', 'Ethnic Wear', 'Sport'] }
    ],
    'Electronics': [
      { key: 'Brand', label: 'BRAND', options: ['Sonic', 'FitPro', 'Keychron', 'ViewMaster', 'Sony', 'Samsung'] },
      { key: 'Color', label: 'COLOR', options: ['Black', 'White', 'Silver', 'Grey'] }
    ],
    'Toys': [
      { key: 'Age Group', label: 'AGE GROUP', options: ['1-4 Years', '5-12 Years', '8+ Years'] },
      { key: 'Skill', label: 'SKILL', options: ['STEM/Coding', 'Motor Skills', 'Coordination'] }
    ],
    'Groceries': [
      { key: 'Brand', label: 'BRAND', options: ['Organic Valley', 'Nestle', 'Local Farm'] },
      { key: 'Type', label: 'TYPE', options: ['Fresh', 'Packaged', 'Beverage'] }
    ],
    'Books': [
      { key: 'Format', label: 'FORMAT', options: ['Hardcover', 'Paperback', 'Audiobook'] },
      { key: 'Language', label: 'LANGUAGE', options: ['English', 'Hindi', 'Regional'] }
    ],
    'Furniture': [
      { key: 'Material', label: 'MATERIAL', options: ['Wood', 'Metal', 'Plastic', 'Glass'] },
      { key: 'Color', label: 'COLOR', options: ['Brown', 'Black', 'White', 'Beige'] }
    ],
    'Sports': [
      { key: 'Brand', label: 'BRAND', options: ['Nike', 'Adidas', 'Puma'] },
      { key: 'Type', label: 'TYPE', options: ['Equipment', 'Apparel', 'Footwear'] }
    ],
    'Beauty': [
      { key: 'Brand', label: 'BRAND', options: ['Loreal', 'Maybelline', 'Lakme'] },
      { key: 'Skin Type', label: 'SKIN TYPE', options: ['All', 'Oily', 'Dry', 'Sensitive'] }
    ],
    'Mobiles': [
      { key: 'Brand', label: 'BRAND', options: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi'] },
      { key: 'RAM', label: 'RAM', options: ['4GB', '6GB', '8GB', '12GB'] },
      { key: 'Storage', label: 'STORAGE', options: ['64GB', '128GB', '256GB', '512GB'] }
    ],
    'Kitchen': [
      { key: 'Material', label: 'MATERIAL', options: ['Steel', 'Glass', 'Ceramic'] },
      { key: 'Brand', label: 'BRAND', options: ['Prestige', 'Pigeon', 'Wonderchef'] }
    ],
    'Health & Wellness': [
      { key: 'Type', label: 'TYPE', options: ['Supplement', 'Equipment', 'Care'] },
      { key: 'Form', label: 'FORM', options: ['Tablet', 'Powder', 'Liquid'] }
    ],
    'Gaming': [
      { key: 'Platform', label: 'PLATFORM', options: ['PC', 'PlayStation', 'Xbox', 'Nintendo'] },
      { key: 'Genre', label: 'GENRE', options: ['Action', 'RPG', 'Sports', 'Strategy'] }
    ],
    'Pet Supplies': [
      { key: 'Pet Type', label: 'PET TYPE', options: ['Dog', 'Cat', 'Bird', 'Fish'] },
      { key: 'Category', label: 'CATEGORY', options: ['Food', 'Toys', 'Accessories'] }
    ],
    'Travel': [
      { key: 'Type', label: 'TYPE', options: ['Luggage', 'Backpack', 'Accessories'] },
      { key: 'Material', label: 'MATERIAL', options: ['Hard Shell', 'Soft Shell', 'Leather'] }
    ],
    'Baby & Kids': [
      { key: 'Age Group', label: 'AGE GROUP', options: ['0-12 Months', '1-3 Years', '3-5 Years'] },
      { key: 'Category', label: 'CATEGORY', options: ['Clothing', 'Toys', 'Care'] }
    ],
    'Home & Living': [
      { key: 'Room', label: 'ROOM', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office'] },
      { key: 'Type', label: 'TYPE', options: ['Decor', 'Bedding', 'Lighting', 'Storage', 'Appliances'] },
      { key: 'Material', label: 'MATERIAL', options: ['Wood', 'Metal', 'Fabric', 'Glass', 'Ceramic'] },
    ],
  };
  const currentAttributes = activeTopCategoryName ? ATTRIBUTE_FILTERS[activeTopCategoryName] || [] : [];

  const flashIdsStr = (flashProducts || []).map(p => p._id).join(',');
  const trendingIdsStr = (trendingProducts || []).map(p => p._id).join(',');
  const premiumIdsStr = (premiumProducts || []).map(p => p._id).join(',');

  useEffect(() => {
    apiClient.get('/categories').then(r => { if (r.data?.success) setCategories(r.data.data); }).catch(() => { });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = user ? 16 : 12;
        const q = { page, limit, status: 'active' };
        if (categoryFilter) q.category = categoryFilter;
        if (searchFilter) q.search = searchFilter;
        if (minPriceFilter) q.minPrice = minPriceFilter;
        if (maxPriceFilter) q.maxPrice = maxPriceFilter;
        if (inStockFilter) q.inStock = 'true';
        if (hasDiscountFilter) q.hasDiscount = 'true';
        if (featuredFilter) q.featuredOnly = 'true';
        if (sortByFilter) q.sortBy = sortByFilter;
        if (Object.keys(specFilters).length > 0) {
          q.specs = {};
          Object.entries(specFilters).forEach(([k, v]) => {
            q.specs[k] = v.join(','); // Send as comma-separated string
          });
        }

        // Exclude products already shown in other sections
        const excludeList = [];
        if (flashIdsStr) {
          excludeList.push(...flashIdsStr.split(','));
        }
        if (trendingIdsStr) {
          excludeList.push(...trendingIdsStr.split(','));
        }
        if (user && premiumIdsStr) {
          excludeList.push(...premiumIdsStr.split(','));
        }
        if (excludeList.length > 0) {
          q.exclude = excludeList.join(',');
        }

        const res = await getProducts(q);
        if (res?.success) { setProducts(res.data.products); setPagination(res.data.pagination); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [searchParams, user, flashIdsStr, trendingIdsStr, premiumIdsStr]);

  // Fetch flash products and trending products when user is a guest (landing page)
  useEffect(() => {
    if (user) return;
    
    // Fetch flash deals (discounted products)
    apiClient.get('/products', { params: { hasDiscount: 'true', limit: 8, status: 'active' } })
      .then(res => {
        const flash = res.data?.success ? (res.data.data.products || []) : [];
        setFlashProducts(flash);
        
        // Fetch trending/featured products, excluding flash deals
        const exclude = flash.map(p => p._id).join(',');
        const params = { limit: 8, status: 'active', sortBy: 'popular' };
        if (exclude) params.exclude = exclude;
        
        return apiClient.get('/products', { params });
      })
      .then(res => {
        if (res?.data?.success) {
          setTrendingProducts(res.data.data.products || []);
        }
      })
      .catch(err => console.error('Error fetching landing page products:', err));
  }, [user]);

  // Fetch trending products, premium products and flash deals for logged-in users
  useEffect(() => {
    if (!user) return;

    let flashList = [];
    let premiumList = [];

    // Fetch flash deals for logged-in users first
    apiClient.get('/products', { params: { hasDiscount: 'true', limit: 8, status: 'active' } })
      .then(res => {
        flashList = res.data?.success ? (res.data.data.products || []) : [];
        setFlashProducts(flashList);

        // Fetch premium/featured products, excluding flash deals
        const exclude = flashList.map(p => p._id).join(',');
        const params = { featuredOnly: 'true', limit: 4, status: 'active', inStock: 'true' };
        if (exclude) params.exclude = exclude;

        return apiClient.get('/products', { params });
      })
      .then(res => {
        premiumList = res.data?.success ? (res.data.data.products || []) : [];
        setPremiumProducts(premiumList);
        
        // Fetch trending products, excluding flash deals and premium products
        const exclude = [...flashList.map(p => p._id), ...premiumList.map(p => p._id)].join(',');
        const params = { limit: 8, status: 'active', sortBy: 'popular' };
        if (exclude) params.exclude = exclude;

        return apiClient.get('/products', { params });
      })
      .then(res => {
        if (res?.data?.success) {
          setTrendingProducts(res.data.data.products || []);
        }
      })
      .catch(err => console.error('Error fetching logged in products:', err));
  }, [user]);

  // Countdown timer for Flash Deals
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashTimer(prev => {
        if (prev.s > 0) {
          return { ...prev, s: prev.s - 1 };
        } else if (prev.m > 0) {
          return { ...prev, m: prev.m - 1, s: 59 };
        } else if (prev.h > 0) {
          return { h: prev.h - 1, m: 59, s: 59 };
        } else {
          return { h: 5, m: 59, s: 59 }; // reset to 6 hours
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);



  const pricePillLabel = (() => {
    const match = PRICE_RANGES.find(r => r.min === minPriceFilter && r.max === maxPriceFilter);
    return match && match.label !== 'All Prices' ? match.label : 'Price Range';
  })();

  /* ─── Shared: Banners ─────────────────────────────────────────────── */
  const renderBanners = () => (
    <Row className="g-3 mb-3">
      {/* Main Large Hero Banner */}
      <Col lg={8}>
        <div
          className="position-relative p-4 rounded-4 shadow-sm text-white d-flex flex-column justify-content-between overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            minHeight: '215px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px'
          }}
        >
          {/* Background Decorative Circles */}
          <div className="position-absolute" style={{ width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,138,0.4) 0%, transparent 70%)', top: '-100px', right: '-50px', pointerEvents: 'none' }} />
          <div className="position-absolute" style={{ width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)', bottom: '-50px', left: '30%', pointerEvents: 'none' }} />

          <div className="position-relative z-1">
            <Badge bg="primary" className="mb-2 px-2.5 py-1 fw-semibold text-uppercase" style={{ borderRadius: '4px', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              ✨ Midseason Special
            </Badge>
            <h1 className="fw-extrabold text-white mb-1" style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
              Curated Collections. Exceptional Quality.
            </h1>
            <p className="text-white-50 mb-3" style={{ fontSize: '0.80rem', maxWidth: '440px' }}>
              Discover premium brands, organic farm products, and handmade local crafts with zero hassle.
            </p>
          </div>

          <div className="position-relative z-1 d-flex flex-wrap gap-2 align-items-center">
            <button
              onClick={() => {
                const updates = { hasDiscount: 'true' };
                setMultiParams(updates);
              }}
              className="btn btn-light text-dark fw-bold px-3 py-1.5"
              style={{ borderRadius: '6px', fontSize: '0.78rem', transition: 'var(--transition-smooth)' }}
            >
              Shop Deals
            </button>
            <button
              onClick={() => setMultiParams({ featuredOnly: 'true' })}
              className="btn border border-white-50 text-white fw-bold px-3 py-1.5"
              style={{ borderRadius: '6px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(4px)', transition: 'var(--transition-smooth)' }}
            >
              Featured
            </button>
          </div>

          {/* Floating glassmorphic tag */}
          <div
            className="position-absolute d-none d-sm-flex align-items-center gap-2 px-2.5 py-1.5 rounded-3"
            style={{
              bottom: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              borderRadius: '8px'
            }}
          >
            <span className="fs-6">🎉</span>
            <div className="text-start">
              <p className="mb-0 text-white fw-bold" style={{ fontSize: '0.70rem' }}>Trust Score Spotlight</p>
              <p className="mb-0 text-white-50" style={{ fontSize: '0.58rem' }}>Verified local merchants</p>
            </div>
          </div>
        </div>
      </Col>

      {/* Sidebar Highlight Promos */}
      <Col lg={4} className="d-flex flex-column justify-content-between gap-2">
        {/* Card 1: Save Voucher */}
        <div
          className="p-3 text-white d-flex flex-column justify-content-between flex-fill position-relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            minHeight: '100px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px'
          }}
        >
          <div className="position-absolute" style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', top: '-50px', right: '-50px', pointerEvents: 'none' }} />
          <div>
            <span className="text-uppercase fw-bold text-white" style={{ fontSize: '0.58rem', letterSpacing: '0.05em', opacity: 0.9 }}>COUPON CODES BY PRICE</span>
            <h6 className="fw-bold text-white mb-1">💰 SAVE ON ORDERS</h6>
            <div style={{ fontSize: '0.70rem', lineHeight: '1.4' }}>
              <span className="text-white fw-bold">SAVE10</span> (10% OFF ₹500+) | <strong className="text-white">SHOPEZ15</strong> (15% OFF ₹3000+)
            </div>
          </div>
        </div>

        {/* Card 2: Live Tracking */}
        <div
          className="p-3 text-white d-flex flex-column justify-content-between flex-fill position-relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
            minHeight: '100px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px'
          }}
        >
          <div className="position-absolute" style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', bottom: '-50px', right: '-50px', pointerEvents: 'none' }} />
          <div>
            <span className="text-uppercase text-white-50 fw-bold" style={{ fontSize: '0.58rem', letterSpacing: '0.05em' }}>Delivery Guarantee</span>
            <h6 className="fw-bold text-white mb-1">REAL-TIME TRACKING</h6>
            <p className="text-white-50 mb-0" style={{ fontSize: '0.68rem' }}>Track your package at every step from dispatch to door.</p>
          </div>
        </div>
      </Col>
    </Row>
  );

  /* ─── Shared: Active chips ────────────────────────────────────────── */
  const renderActiveChips = (className = 'mb-3') => hasAnyFilter ? (
    <div className={`d-flex flex-wrap gap-2 ${className}`}>
      {categoryFilter && <Badge bg="primary" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => setParam('category', '')}>{activeCatObj?.name} ✕</Badge>}
      {(minPriceFilter || maxPriceFilter) && <Badge bg="secondary" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => setMultiParams({ minPrice: '', maxPrice: '' })}>₹{minPriceFilter || '0'}–₹{maxPriceFilter || '∞'} ✕</Badge>}
      {inStockFilter && <Badge bg="success" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => toggleParam('inStock', false)}>In Stock ✕</Badge>}
      {hasDiscountFilter && <Badge bg="danger" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => toggleParam('hasDiscount', false)}>On Sale ✕</Badge>}
      {featuredFilter && <Badge bg="warning" text="dark" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => toggleParam('featuredOnly', false)}>Featured ✕</Badge>}
      {sortByFilter && <Badge bg="info" text="dark" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => setParam('sortBy', '')}>{SORT_OPTIONS.find(o => o.value === sortByFilter)?.label} ✕</Badge>}
      {Object.entries(specFilters).map(([k, values]) => values.map(v => (
        <Badge key={`${k}-${v}`} bg="dark" className="px-2 py-1 fw-normal" style={{ borderRadius: '4px', cursor: 'pointer' }} onClick={() => toggleSpecFilter(k, v)}>{v} ✕</Badge>
      )))}
    </div>
  ) : null;

  /* ─── Shared: Product card ────────────────────────────────────────── */
  const renderProductCard = (product) => {
    const disc = product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
    return (
      <Card className="card-earthy h-100 border-0 shadow-sm" style={{ borderRadius: '10px' }}>
        <div className="position-relative overflow-hidden" style={{ borderRadius: '10px 10px 0 0' }}>
          <Card.Img variant="top"
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
            }}
            className="product-img-zoom"
            style={{ height: '125px', objectFit: 'cover' }} />
          {disc > 0 && <Badge bg="danger" className="position-absolute m-2 top-0 start-0 px-2 py-0.5" style={{ borderRadius: '3px', fontSize: '0.62rem', fontWeight: 700 }}>{disc}% OFF</Badge>}
          {product.stock <= 0 && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ background: 'rgba(0,0,0,0.35)' }}>
              <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>Out of Stock</span>
            </div>
          )}
        </div>
        <Card.Body className="d-flex flex-column p-2">
          <span className="text-muted mb-0.5" style={{ fontSize: '0.62rem', fontWeight: 500 }}>{product.category?.name}</span>
          <Card.Title className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
            <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">{product.name}</Link>
          </Card.Title>
          <div className="mt-auto d-flex justify-content-between align-items-center pt-1 border-top border-light">
            <div>
              <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
              </span>
              {product.discountPrice && (
                <span className="text-decoration-line-through text-muted ms-1" style={{ fontSize: '0.62rem' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <Button className="btn-earthy btn-sm py-0.5 px-2 text-white" style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px' }} as={Link} to={`/products/${product._id}`}>View</Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  /* ─── Shared: Product grid + pagination ──────────────────────────── */
  const renderProductGrid = (cols) => (
    loading ? (
      <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="text-muted small mt-2">Loading...</p></div>
    ) : products.length > 0 ? (
      <>
        <Row className="row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 gy-4 gx-3">
          {products.map(p => <Col key={p._id}>{renderProductCard(p)}</Col>)}
        </Row>
        {pagination.pages > 1 && (
          <div className="d-flex justify-content-center mt-1 mb-1">
            <Pagination size="sm">
              <Pagination.Prev onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} />
              {[...Array(pagination.pages).keys()].map(n => (
                <Pagination.Item key={n + 1} active={n + 1 === pagination.page} onClick={() => handlePageChange(n + 1)}>{n + 1}</Pagination.Item>
              ))}
              <Pagination.Next onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} />
            </Pagination>
          </div>
        )}
      </>
    ) : (
      <div className="p-5 bg-white border rounded-2 text-center text-muted shadow-sm">
        <div className="fs-1 mb-3">🔍</div>
        <h5>No Products Found</h5>
        <p className="small mb-3">No products match your current filters.</p>
        <Button className="btn-earthy btn-sm" onClick={clearAllFilters}>Clear All Filters</Button>
      </div>
    )
  );

  /* ═══════════════════════════════════════════════════════════════════
      LOGGED-IN LAYOUT — sidebar + 3-col grid
  ═══════════════════════════════════════════════════════════════════ */
  if (user) {
    return (
      <div className="pt-0 pb-3">
        <CategoryBar
          topLevelCategories={topLevelCategories}
          activeCategoryBarId={activeCategoryBarId}
          onCategoryClick={handleCategoryBarClick}
          getEmoji={getEmoji}
        />
        {renderBanners()}

        {/* Flash Deals Section */}
        {flashProducts.length > 0 && (
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Badge bg="danger" className="px-2 py-1" style={{ borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ FLASH DEAL
                </Badge>
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.1rem' }}>Limited Time Offers</h4>
              </div>
              <div className="text-danger fw-bold" style={{ fontSize: '0.9rem' }}>
                Ends in {String(flashTimer.h).padStart(2, '0')}:{String(flashTimer.m).padStart(2, '0')}:{String(flashTimer.s).padStart(2, '0')}
              </div>
            </div>
            <Row className="g-3 flex-nowrap" style={{ overflowX: 'auto', paddingBottom: '10px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {flashProducts.slice(0, 8).map((p) => {
                const discPercent = Math.round(((p.price - (p.discountPrice || p.price)) / p.price) * 100);
                return (
                  <Col key={p._id} style={{ flex: '0 0 auto', width: '260px' }}>
                    <Card className="card-earthy h-100 border-0 shadow-sm" style={{ borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                      {/* Discount Badge */}
                      <div className="position-absolute badge bg-danger" style={{ top: '10px', left: '10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, zIndex: 10, padding: '0.3rem 0.5rem' }}>
                        -{discPercent}%
                      </div>

                      {/* Product Image - Reduced height */}
                      <Card.Img variant="top" src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'} style={{ height: '180px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />

                      {/* Product Body */}
                      <Card.Body className="p-2 d-flex flex-column">
                        {/* Product Name */}
                        <Card.Title className="fw-bold text-dark text-truncate mb-2" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                          <Link to={`/products/${p._id}`} className="text-decoration-none text-dark">{p.name}</Link>
                        </Card.Title>

                        {/* Price Section */}
                        <div className="mb-2">
                          <div className="d-flex align-items-baseline gap-2">
                            <span className="fw-bold text-danger" style={{ fontSize: '1rem' }}>
                              ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                            </span>
                            {p.discountPrice && (
                              <span className="text-decoration-line-through text-muted" style={{ fontSize: '0.8rem' }}>
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grab Now Button */}
                        <Button className="fw-bold py-1 mt-auto" style={{ 
                          background: '#000', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '6px', 
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }} as={Link} to={`/products/${p._id}`}>
                          Grab Now
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* SHOP BY CATEGORY grid - ONLY for logged-in users, when no non-category filters are active */}
        {!hasNonCategoryFilter && topLevelCategories.length > 0 && (
          <div className="mb-4 p-4 border rounded-4 bg-white shadow-sm">
            <div className="text-center mb-4">
              <h4 className="fw-bold text-dark mb-2" style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)' }}>🏷️ SHOP BY CATEGORY</h4>
              <p className="text-muted mb-0 small">Browse our collection by category</p>
            </div>
            <Row className="g-3">
              {topLevelCategories.map(cat => {
                const catImage = cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

                return (
                  <Col xs={6} sm={4} md={3} lg={2} key={cat._id}>
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetUrl = `/products?category=${cat._id}`;
                        console.log('CATEGORY CLICKED:', cat.name, 'ID:', cat._id);
                        console.log('TARGET URL:', targetUrl);
                        window.location.href = targetUrl;
                      }}
                      className="d-flex flex-column h-100 cursor-pointer"
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                      {/* Image Container - Using img tag for reliability */}
                      <div
                        className="position-relative overflow-hidden rounded-2 shadow-sm flex-grow-1"
                        style={{
                          minHeight: '220px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          const img = e.currentTarget.querySelector('img');
                          if (img) img.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          const img = e.currentTarget.querySelector('img');
                          if (img) img.style.transform = 'scale(1)';
                        }}
                      >
                        <img
                          src={catImage}
                          alt={cat.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.3s ease',
                            transform: 'scale(1)',
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>

                      {/* Category Name - Below Image */}
                      <div className="text-center mt-3 pb-2">
                        <h6 className="text-dark fw-bold mb-0" style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
                          {cat.name}
                        </h6>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* Trending Products Section */}
        {trendingProducts.length > 0 && (
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.1rem' }}>🔥 Trending Now</h4>
                <Badge bg="danger" className="px-2 py-1" style={{ borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', animation: 'pulse 2s infinite' }}>
                  HOT
                </Badge>
              </div>
              <Link to="/products?sortBy=popular" className="text-primary text-decoration-none fw-bold small">View All →</Link>
            </div>
            <div className="d-flex gap-3 overflow-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              {trendingProducts.slice(0, 8).map((p, idx) => (
                <div key={p._id} style={{ flex: '0 0 auto', width: '200px' }}>
                  <Card className="card-earthy h-100 border-0 shadow-sm" style={{ borderRadius: '12px', position: 'relative' }}>
                    {/* Trending Badge with Rank */}
                    <div className="position-absolute d-flex align-items-center justify-content-center" style={{ 
                      top: '10px', 
                      left: '10px', 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%', 
                      background: idx < 3 ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      zIndex: 10,
                      color: 'white',
                      boxShadow: idx < 3 ? '0 2px 8px rgba(255,107,107,0.4)' : '0 2px 8px rgba(251,191,36,0.4)'
                    }}>
                      #{idx + 1}
                    </div>
                    <Card.Img variant="top" src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} style={{ height: '130px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                    <Card.Body className="p-2">
                      <Card.Title className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                        <Link to={`/products/${p._id}`} className="text-decoration-none text-dark">{p.name}</Link>
                      </Card.Title>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                          ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                        </span>
                        {p.discountPrice && (
                          <span className="text-decoration-line-through text-muted" style={{ fontSize: '0.65rem' }}>
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-1">
                          <span style={{ fontSize: '0.7rem', color: idx < 3 ? '#ff6b6b' : '#fbbf24' }}>
                            {idx < 3 ? '🔥' : '⭐'}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {idx < 3 ? 'Hot' : 'Popular'}
                          </span>
                        </div>
                        <Button className="btn-earthy btn-sm py-1 px-2" style={{ fontSize: '0.7rem', borderRadius: '4px' }} as={Link} to={`/products/${p._id}`}>Details</Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="my-4" style={{ borderColor: 'var(--border-clay)', opacity: 0.15 }} />

        {/* Premium Products Section */}
        {premiumProducts.length > 0 && (
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.1rem' }}>👑 Premium Products</h4>
              <Link to="/products?featuredOnly=true" className="text-primary text-decoration-none fw-bold small">View All →</Link>
            </div>
            <Row className="g-3">
              {premiumProducts.slice(0, 4).map(p => (
                <Col xs={6} sm={3} key={p._id}>
                  <Card className="card-earthy h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="position-absolute badge" style={{ top: '10px', left: '10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, zIndex: 10, background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', textTransform: 'uppercase' }}>
                      Featured
                    </div>
                    <Card.Img variant="top" src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'} style={{ height: '130px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                    <Card.Body className="p-2">
                      <Card.Title className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                        <Link to={`/products/${p._id}`} className="text-decoration-none text-dark">{p.name}</Link>
                      </Card.Title>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                          ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                        </span>
                        {p.discountPrice && (
                          <span className="text-decoration-line-through text-muted" style={{ fontSize: '0.65rem' }}>
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <Button className="btn-earthy btn-sm w-100 py-1 mt-2" style={{ fontSize: '0.7rem', borderRadius: '4px' }} as={Link} to={`/products/${p._id}`}>Details</Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* ── Product grid (full width) ────────────────────────── */}
        <div ref={productsRef} className="d-flex align-items-center flex-wrap gap-2 mb-3">
          <span className="small text-muted fw-semibold me-2">
            Showing <strong>{pagination.total}</strong> product{pagination.total !== 1 ? 's' : ''}
          </span>
          {renderActiveChips('mb-0')}
        </div>
        {renderProductGrid({ xs: 6, sm: 4, md: 3, lg: 2 })}
      </div>
    );
  }
  const renderFlashDealsSection = () => {
    if (!flashProducts || flashProducts.length === 0) return null;
    return (
      <div className="landing-flash-section mb-2 p-4 border rounded-4 bg-white shadow-sm" style={{ marginTop: '8px' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger d-flex align-items-center gap-1 py-2 px-3 fs-6 rounded-pill">
              ⚡ FLASH DEAL
            </span>
            <span className="fw-bold text-dark fs-5">Limited Time Offers</span>
          </div>
          <div className="d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-pill border">
            <span className="small text-muted fw-semibold">Ends in:</span>
            <span className="font-monospace fw-bold text-danger">
              {String(flashTimer.h).padStart(2, '0')}:{String(flashTimer.m).padStart(2, '0')}:{String(flashTimer.s).padStart(2, '0')}
            </span>
          </div>
        </div>
        <Row className="g-3">
          {flashProducts.map((prod, idx) => {
            const disc = prod.discountPrice
              ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;
            const stockLeft = [4, 8, 12, 3][idx % 4];
            return (
              <Col xs={12} sm={6} md={3} key={prod._id}>
                <Card className="h-100 border-0 shadow-sm overflow-hidden position-relative rounded-3 landing-compact-card">
                  {disc > 0 && (
                    <span className="badge bg-danger position-absolute top-0 start-0 m-2 z-1">
                      -{disc}%
                    </span>
                  )}
                  <div style={{ height: '140px', overflow: 'hidden' }}>
                    <Card.Img
                      variant="top"
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                      style={{ height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      className="product-img"
                    />
                  </div>
                  <Card.Body className="p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="text-truncate fw-bold mb-1" style={{ fontSize: '0.88rem' }}>
                        <Link to={`/products/${prod._id}`} className="text-decoration-none text-dark">
                          {prod.name}
                        </Link>
                      </h6>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fw-bold text-danger" style={{ fontSize: '0.95rem' }}>
                          ₹{(prod.discountPrice || prod.price).toLocaleString('en-IN')}
                        </span>
                        {prod.discountPrice && (
                          <span className="text-muted text-decoration-line-through small">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '0.75rem' }}>
                        <span className="text-danger fw-bold">⚡ Only {stockLeft} left</span>
                        <span className="text-muted">Almost Gone</span>
                      </div>
                      <div className="progress" style={{ height: '5px' }}>
                        <div
                          className="progress-bar bg-danger"
                          role="progressbar"
                          style={{ width: `${(stockLeft / 15) * 100}%` }}
                          aria-valuenow={stockLeft}
                          aria-valuemin="0"
                          aria-valuemax="15"
                        />
                      </div>
                      <Button
                        as={Link}
                        to={`/products/${prod._id}`}
                        variant="dark"
                        size="sm"
                        className="w-100 mt-2 rounded-pill text-white fw-bold py-1"
                        style={{ fontSize: '0.78rem' }}
                      >
                        Grab Now
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  const renderTrendingSection = () => {
    if (!trendingProducts || trendingProducts.length === 0) return null;
    return (
      <div className="landing-trending-section mb-2 p-4 border rounded-4 bg-white shadow-sm">
        <div className="mb-4">
          <span className="landing-badge-label">CURATED SELECTION</span>
          <h2 className="landing-section-heading">Trending Collections</h2>
          <p className="text-muted mb-0 small">Discover what’s hot in our marketplace right now</p>
        </div>
        <Row className="g-3">
          {trendingProducts.map((prod) => {
            const disc = prod.discountPrice
              ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;
            return (
              <Col xs={12} sm={6} md={3} key={prod._id}>
                <Card className="h-100 border-0 shadow-sm overflow-hidden position-relative rounded-3 landing-compact-card">
                  {disc > 0 && (
                    <span className="badge bg-success position-absolute top-0 start-0 m-2 z-1">
                      -{disc}%
                    </span>
                  )}
                  <div style={{ height: '140px', overflow: 'hidden' }}>
                    <Card.Img
                      variant="top"
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                      style={{ height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      className="product-img"
                    />
                  </div>
                  <Card.Body className="p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="text-truncate fw-bold mb-1" style={{ fontSize: '0.88rem' }}>
                        <Link to={`/products/${prod._id}`} className="text-decoration-none text-dark">
                          {prod.name}
                        </Link>
                      </h6>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                          ₹{(prod.discountPrice || prod.price).toLocaleString('en-IN')}
                        </span>
                        {prod.discountPrice && (
                          <span className="text-muted text-decoration-line-through small">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      as={Link}
                      to={`/products/${prod._id}`}
                      variant="outline-primary"
                      size="sm"
                      className="w-100 mt-1 rounded-pill fw-semibold py-1"
                      style={{ fontSize: '0.78rem' }}
                    >
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  const renderWhyShopEZSection = () => {
    const features = [
      { icon: '🚀', title: 'Fast Delivery', desc: 'Shipped in 24-48 hours' },
      { icon: '🛡️', title: 'Verified Sellers', desc: '100% genuine merchants' },
      { icon: '✨', title: 'Premium Quality', desc: 'Vetted by quality testers' },
      { icon: '🔒', title: 'Secure Payments', desc: 'Fully encrypted checkouts' },
      { icon: '🤖', title: 'AI Recommendations', desc: 'Tailored recommendations' },
      { icon: '🌿', title: 'Eco Packaging', desc: 'Biodegradable packaging' },
    ];
    return (
      <div className="landing-why-section mb-2 p-4 border rounded-4 bg-white shadow-sm">
        <div className="text-center mb-4">
          <span className="landing-badge-label">OUR PROMISE</span>
          <h2 className="landing-section-heading">Why ShopEZ?</h2>
          <p className="text-muted mb-0 small">A premium, secure, and modern shopping experience built for you.</p>
        </div>
        <Row className="g-3">
          {features.map((f, i) => (
            <Col xs={6} md={2} key={i}>
              <div className="text-center p-3 rounded-3 border bg-light h-100 hover-scale" style={{ transition: 'all 0.3s' }}>
                <div className="fs-3 mb-2">{f.icon}</div>
                <h6 className="fw-bold mb-1" style={{ fontSize: '0.85rem' }}>{f.title}</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.3' }}>{f.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderReviewsSection = () => {
    const reviews = [
      { name: 'Aarav Sharma', rating: 5, text: 'Amazing service! The delivery took only 1 day. Will buy again.', product: 'Premium Wireless Headphones' },
      { name: 'Isha Patel', rating: 5, text: 'Great quality, organic packaging. Extremely satisfied with my purchase.', product: 'Natural Cotton Bed Sheets' },
      { name: 'Kabir Verma', rating: 5, text: 'The interface is so clean. Security is top notch.', product: 'STEM Robot Building Kit' },
      { name: 'Meera Sen', rating: 5, text: 'Fabulous products. Recommending this platform to everyone.', product: 'Ergonomic Desk Chair' },
    ];
    return (
      <div className="landing-reviews-section mb-2 p-4 border rounded-4 bg-white shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <span className="landing-badge-label">HAPPY CLIENTS</span>
            <h2 className="landing-section-heading">Customer Reviews</h2>
            <p className="text-muted mb-0 small">See what verified buyers are saying</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={() => {
                const carousel = document.getElementById('review-scroll-container');
                if (carousel) carousel.scrollBy({ left: -260, behavior: 'smooth' });
              }}
            >
              ←
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={() => {
                const carousel = document.getElementById('review-scroll-container');
                if (carousel) carousel.scrollBy({ left: 260, behavior: 'smooth' });
              }}
            >
              →
            </Button>
          </div>
        </div>
        <div
          id="review-scroll-container"
          className="d-flex gap-3 overflow-auto pb-2 hide-scrollbar"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {reviews.map((r, i) => (
            <div
              key={i}
              className="border p-3 rounded-3 bg-light flex-shrink-0"
              style={{ width: '280px', scrollSnapAlign: 'start' }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}
                >
                  {r.name.charAt(0)}
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.85rem' }}>{r.name}</h6>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill py-0 px-2" style={{ fontSize: '0.62rem' }}>
                    ✓ Verified Buyer
                  </span>
                </div>
              </div>
              <div className="text-warning mb-2" style={{ fontSize: '0.85rem' }}>
                {'★'.repeat(r.rating)}
              </div>
              <p className="text-muted mb-2" style={{ fontSize: '0.78rem', minHeight: '40px', lineHeight: '1.4' }}>
                "{r.text}"
              </p>
              <div className="border-top pt-2 mt-2" style={{ fontSize: '0.72rem' }}>
                <span className="text-muted">Item: </span>
                <span className="fw-semibold text-primary">{r.product}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
      GUEST LAYOUT — horizontal filter bar + 4-col full-width grid
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="pt-0 pb-3">
      <CategoryBar
        topLevelCategories={topLevelCategories}
        activeCategoryBarId={activeCategoryBarId}
        onCategoryClick={handleCategoryBarClick}
        getEmoji={getEmoji}
      />
      {renderBanners()}

      {/* Horizontal filter toolbar */}
      <div className="card-earthy mb-3 px-3 py-2 d-flex align-items-center flex-wrap gap-2" style={{ overflow: 'visible', position: 'relative', zIndex: 20 }}>
        <FilterDropdown label={sortByFilter ? SORT_OPTIONS.find(o => o.value === sortByFilter)?.label : 'Sort By'} icon="↕" active={!!sortByFilter}>
          {SORT_OPTIONS.map(o => <DropdownItem key={o.value} label={o.label} active={sortByFilter === o.value} onClick={() => setParam('sortBy', o.value)} />)}
        </FilterDropdown>

        {/* Dynamic Attributes (Guest Filter Bar) */}
        {currentAttributes.map(attr => {
          const selectedCount = specFilters[attr.key] ? specFilters[attr.key].length : 0;
          return (
            <FilterDropdown key={attr.key} label={selectedCount > 0 ? `${attr.label} (${selectedCount})` : attr.label} active={selectedCount > 0}>
              <DropdownItem label={`Clear ${attr.label}`} active={selectedCount === 0} onClick={() => clearSpecFilter(attr.key)} />
              {attr.options.map(opt => (
                <DropdownItem key={opt} label={opt} active={specFilters[attr.key]?.includes(opt)} onClick={() => toggleSpecFilter(attr.key, opt)} />
              ))}
            </FilterDropdown>
          )
        })}

        <FilterDropdown label={pricePillLabel} icon="₹" active={!!(minPriceFilter || maxPriceFilter)}>
          {PRICE_RANGES.map(r => (
            <DropdownItem key={r.label} label={r.label} active={minPriceFilter === r.min && maxPriceFilter === r.max}
              onClick={() => setMultiParams({ minPrice: r.min, maxPrice: r.max })} />
          ))}
          <div className="px-3 pt-2 border-top mt-1" onClick={e => e.stopPropagation()}>
            <p className="small text-muted mb-1 fw-semibold">Custom</p>
            <div className="d-flex gap-1 align-items-center">
              <input type="number" placeholder="Min" value={minPriceFilter} onChange={e => setParam('minPrice', e.target.value)}
                className="form-control form-control-sm" style={{ width: '75px' }} />
              <span className="text-muted small">–</span>
              <input type="number" placeholder="Max" value={maxPriceFilter} onChange={e => setParam('maxPrice', e.target.value)}
                className="form-control form-control-sm" style={{ width: '75px' }} />
            </div>
          </div>
        </FilterDropdown>

        <button onClick={() => toggleParam('hasDiscount', !hasDiscountFilter)}
          className={`btn btn-sm px-3 py-1 rounded-2 border ${hasDiscountFilter ? 'btn-danger text-white' : 'btn-light border-secondary text-dark'}`}
          style={{ fontWeight: 600, fontSize: '0.82rem' }}>🏷️ On Sale</button>

        <button onClick={() => toggleParam('inStock', !inStockFilter)}
          className={`btn btn-sm px-3 py-1 rounded-2 border ${inStockFilter ? 'btn-success text-white' : 'btn-light border-secondary text-dark'}`}
          style={{ fontWeight: 600, fontSize: '0.82rem' }}>✅ In Stock</button>

        <button onClick={() => toggleParam('featuredOnly', !featuredFilter)}
          className={`btn btn-sm px-3 py-1 rounded-2 border ${featuredFilter ? 'btn-warning text-dark' : 'btn-light border-secondary text-dark'}`}
          style={{ fontWeight: 600, fontSize: '0.82rem' }}>⭐ Featured</button>
        {categoryFilter && (
          <span className="text-muted small text-nowrap ms-auto me-2">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
          </span>
        )}
        {hasAnyFilter && (
          <button onClick={clearAllFilters} className={`btn btn-link btn-sm text-danger ${categoryFilter ? '' : 'ms-auto'} p-0 text-decoration-none fw-bold small text-nowrap`}>
            Clear All ✕
          </button>
        )}
      </div>

      {renderActiveChips()}

      {/* Products grid - always shown */}
      {renderProductGrid({ xs: 6, sm: 4, md: 3 })}

      {/* Landing sections - shown only when no filters active */}
      {!hasAnyFilter && (
        <>
          {renderFlashDealsSection()}
          {renderTrendingSection()}
          {renderWhyShopEZSection()}
          {renderReviewsSection()}
        </>
      )}
    </div>
  );
};

export default Home;
