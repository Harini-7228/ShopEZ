import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Pagination, Spinner, Form } from 'react-bootstrap';
import { getProducts } from '../api/products';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = [
  { value: '',           label: 'Newest First'      },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'discount',   label: 'Best Discount'     },
  { value: 'name_asc',   label: 'Name: A → Z'       },
];

const PRICE_RANGES = [
  { label: 'All Prices',      min: '',     max: ''     },
  { label: 'Under ₹500',      min: '',     max: '500'  },
  { label: '₹500 – ₹1,999',  min: '500',  max: '1999' },
  { label: '₹2,000 – ₹9,999',min: '2000', max: '9999' },
  { label: '₹10,000+',        min: '10000',max: ''     },
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
          style={{ zIndex: 1050, minWidth: '185px', top: '100%', left: 0 }}
          onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
};
const DropdownItem = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`btn border-0 w-100 text-start px-3 py-1 small ${active ? 'fw-bold text-primary' : 'text-dark'}`}
    style={{ background: active ? '#f0f4ff' : 'transparent', fontSize: '0.83rem' }}>
    {active ? '✓ ' : ''}{label}
  </button>
);

/* ── Sidebar section header ── */
const SectionHead = ({ children }) => (
  <p className="text-uppercase fw-bold text-muted mb-2"
    style={{ fontSize: '0.68rem', letterSpacing: '0.07em' }}>
    {children}
  </p>
);

const Home = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 16, pages: 1, total: 0 });

  const categoryEmojis = {
    groceries:'🍎', fashion:'👕', electronics:'💻', mobiles:'📱',
    toys:'🧸', furniture:'🛋️', sports:'⚽', beauty:'💄', books:'📚',
    kitchen:'🍳', health:'💊', wellness:'💊', gaming:'🎮',
    pet:'🐾', travel:'✈️', baby:'👶', kids:'👶',
    home:'🏠', living:'🏠',
  };
  const getEmoji = (name) => {
    const k = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, e] of Object.entries(categoryEmojis))
      if (k.includes(key) || key.includes(k)) return e;
    return '📦';
  };

  // URL-synced filter state
  const categoryFilter    = searchParams.get('category')    || '';
  const searchFilter      = searchParams.get('search')      || '';
  const minPriceFilter    = searchParams.get('minPrice')    || '';
  const maxPriceFilter    = searchParams.get('maxPrice')    || '';
  const inStockFilter     = searchParams.get('inStock')     === 'true';
  const hasDiscountFilter = searchParams.get('hasDiscount') === 'true';
  const featuredFilter    = searchParams.get('featuredOnly') === 'true';
  const sortByFilter      = searchParams.get('sortBy')      || '';

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

  useEffect(() => {
    apiClient.get('/categories').then(r => { if (r.data?.success) setCategories(r.data.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const q = { page, limit: 16, status: 'active' };
        if (categoryFilter)    q.category     = categoryFilter;
        if (searchFilter)      q.search       = searchFilter;
        if (minPriceFilter)    q.minPrice     = minPriceFilter;
        if (maxPriceFilter)    q.maxPrice     = maxPriceFilter;
        if (inStockFilter)     q.inStock      = 'true';
        if (hasDiscountFilter) q.hasDiscount  = 'true';
        if (featuredFilter)    q.featuredOnly = 'true';
        if (sortByFilter)      q.sortBy       = sortByFilter;
        if (Object.keys(specFilters).length > 0) {
          q.specs = {};
          Object.entries(specFilters).forEach(([k, v]) => {
            q.specs[k] = v.join(','); // Send as comma-separated string
          });
        }
        const res = await getProducts(q);
        if (res?.success) { setProducts(res.data.products); setPagination(res.data.pagination); }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [searchParams]);

  const pricePillLabel = (() => {
    const match = PRICE_RANGES.find(r => r.min === minPriceFilter && r.max === maxPriceFilter);
    return match && match.label !== 'All Prices' ? match.label : 'Price Range';
  })();

  /* ─── Shared: Category scrollbar ─────────────────────────────────── */
  const CategoryBar = () => (
    <div className="bg-white border border-clay rounded-2 p-2 mb-3 shadow-sm">
      <div className="d-flex justify-content-between align-items-center flex-wrap px-1">
        <button onClick={() => setParam('category', '')}
          className={`btn border-0 d-flex flex-column align-items-center p-2 rounded-2 flex-fill ${!activeTopCategoryId ? 'bg-light fw-bold text-primary' : 'text-dark bg-transparent'}`}
          style={{ minWidth: '58px' }}>
          <span className="fs-4 mb-1">🛍️</span>
          <span className="text-nowrap" style={{ fontSize: '0.7rem' }}>All Items</span>
        </button>
        {topLevelCategories.map(cat => (
          <button key={cat._id} onClick={() => setParam('category', cat._id)}
            className={`btn border-0 d-flex flex-column align-items-center p-2 rounded-2 flex-fill ${activeTopCategoryId === cat._id ? 'bg-light fw-bold text-primary' : 'text-dark bg-transparent'}`}
            style={{ minWidth: '58px' }}>
            <span className="fs-4 mb-1">{getEmoji(cat.name)}</span>
            <span className="text-nowrap" style={{ fontSize: '0.7rem' }}>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  /* ─── Shared: Banners ─────────────────────────────────────────────── */
  const Banners = () => (
    <Row className="g-3 mb-3">
      {[
        { bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', tag: 'Season Sale',      title: 'UP TO 50% OFF',    sub: 'Premium quality brands' },
        { bg: 'linear-gradient(135deg,#0d9488,#0f766e)', tag: 'Exclusive Voucher', title: 'SAVE EXTRA ₹1,500',sub: 'Apply code at checkout' },
        { bg: 'linear-gradient(135deg,#b45309,#d97706)', tag: 'Fast Delivery',     title: 'ORDER TRACKING',   sub: 'Live shipping updates' },
      ].map(b => (
        <Col md={4} key={b.title}>
          <Card className="border-0 rounded-2 shadow-sm text-center" style={{ background: b.bg, height: '110px' }}>
            <Card.Body className="d-flex flex-column justify-content-center">
              <span className="small text-uppercase fw-bold text-white-50">{b.tag}</span>
              <h6 className="fw-bold text-white mb-0">{b.title}</h6>
              <p className="text-white-50 mb-0" style={{ fontSize: '0.7rem' }}>{b.sub}</p>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  /* ─── Shared: Active chips ────────────────────────────────────────── */
  const ActiveChips = () => hasAnyFilter ? (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {categoryFilter     && <Badge bg="primary" className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => setParam('category','')}>{activeCatObj?.name} ✕</Badge>}
      {(minPriceFilter||maxPriceFilter) && <Badge bg="secondary" className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => setMultiParams({minPrice:'',maxPrice:''})}>₹{minPriceFilter||'0'}–₹{maxPriceFilter||'∞'} ✕</Badge>}
      {inStockFilter      && <Badge bg="success"  className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => toggleParam('inStock',false)}>In Stock ✕</Badge>}
      {hasDiscountFilter  && <Badge bg="danger"   className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => toggleParam('hasDiscount',false)}>On Sale ✕</Badge>}
      {featuredFilter     && <Badge bg="warning" text="dark" className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => toggleParam('featuredOnly',false)}>Featured ✕</Badge>}
      {sortByFilter       && <Badge bg="info" text="dark" className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => setParam('sortBy','')}>{SORT_OPTIONS.find(o=>o.value===sortByFilter)?.label} ✕</Badge>}
      {Object.entries(specFilters).map(([k, values]) => values.map(v => (
        <Badge key={`${k}-${v}`} bg="dark" className="px-2 py-1 fw-normal" style={{ borderRadius:'4px',cursor:'pointer' }} onClick={() => toggleSpecFilter(k, v)}>{v} ✕</Badge>
      )))}
    </div>
  ) : null;

  /* ─── Shared: Product card ────────────────────────────────────────── */
  const ProductCard = ({ product }) => {
    const disc = product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
    return (
      <Card className="card-earthy h-100 border-0 shadow-sm" style={{ borderRadius:'8px' }}>
        <div className="position-relative overflow-hidden" style={{ borderRadius:'8px 8px 0 0' }}>
          <Card.Img variant="top"
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
            style={{ height:'175px', objectFit:'cover' }} />
          {disc > 0 && <Badge bg="danger" className="position-absolute m-2 top-0 start-0" style={{ borderRadius:'4px', fontSize:'0.68rem' }}>{disc}% OFF</Badge>}
          {product.stock <= 0 && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ background:'rgba(0,0,0,0.35)' }}>
              <span className="badge bg-dark">Out of Stock</span>
            </div>
          )}
        </div>
        <Card.Body className="d-flex flex-column p-2">
          <span className="text-muted mb-1" style={{ fontSize:'0.68rem' }}>{product.category?.name}</span>
          <Card.Title className="fw-bold text-dark text-truncate mb-2" style={{ fontSize:'0.84rem' }}>
            <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">{product.name}</Link>
          </Card.Title>
          <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top border-light">
            <div>
              <span className="fw-bold text-dark" style={{ fontSize:'0.93rem' }}>
                ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
              </span>
              {product.discountPrice && (
                <span className="text-decoration-line-through text-muted ms-1" style={{ fontSize:'0.68rem' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <Button className="btn-earthy btn-sm py-0 px-2 text-white" style={{ fontSize:'0.73rem' }} as={Link} to={`/products/${product._id}`}>View</Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  /* ─── Shared: Product grid + pagination ──────────────────────────── */
  const ProductGrid = ({ cols }) => (
    loading ? (
      <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="text-muted small mt-2">Loading...</p></div>
    ) : products.length > 0 ? (
      <>
        <Row className={`gy-3 gx-3`}>
          {products.map(p => <Col key={p._id} {...cols}><ProductCard product={p} /></Col>)}
        </Row>
        {pagination.pages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination size="sm">
              <Pagination.Prev onClick={() => handlePageChange(pagination.page-1)} disabled={pagination.page===1} />
              {[...Array(pagination.pages).keys()].map(n => (
                <Pagination.Item key={n+1} active={n+1===pagination.page} onClick={() => handlePageChange(n+1)}>{n+1}</Pagination.Item>
              ))}
              <Pagination.Next onClick={() => handlePageChange(pagination.page+1)} disabled={pagination.page===pagination.pages} />
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
      <div className="py-3">
        <CategoryBar />
        <Banners />

        <Row>
          {/* ── Left Sidebar ────────────────────────────────────── */}
          <Col xs={12} lg={3} className="mb-4 sidebar-custom">
            <Card className="border-0 shadow-sm bg-white" style={{ borderRadius:'8px', position:'sticky', top:'80px' }}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                <span className="fw-bold text-dark" style={{ fontSize:'0.9rem' }}>🎛️ Filters</span>
                {hasAnyFilter && (
                  <button onClick={clearAllFilters} className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-bold" style={{ fontSize:'0.75rem' }}>
                    Clear All
                  </button>
                )}
              </div>

              <div className="p-3">

                {/* Sort */}
                <div className="mb-3">
                  <SectionHead>Sort By</SectionHead>
                  <Form.Select size="sm" value={sortByFilter} onChange={e => setParam('sortBy', e.target.value)}
                    className="form-control-earthy py-1" style={{ fontSize:'0.82rem' }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Form.Select>
                </div>

                <hr className="my-2" />

                {/* Dynamic Attributes */}
                {currentAttributes.length > 0 && (
                  <>
                    {currentAttributes.map(attr => (
                      <div key={attr.key} className="mb-3 border-top pt-3">
                        <SectionHead>{attr.label}</SectionHead>
                        <div className="d-flex flex-column gap-2 mt-2 ps-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {attr.options.map(opt => (
                            <div key={opt} className="d-flex align-items-center gap-2">
                              <Form.Check 
                                type="checkbox"
                                id={`spec-${attr.key}-${opt}`}
                                label={
                                  <div className="d-flex align-items-center gap-2">
                                    {attr.key === 'Color' && (
                                      <div style={{ width:'14px', height:'14px', borderRadius:'50%', background: opt.toLowerCase() === 'multicolor' ? 'linear-gradient(45deg, red, blue, yellow)' : opt.toLowerCase(), border: '1px solid #ddd' }} />
                                    )}
                                    {opt}
                                  </div>
                                }
                                checked={specFilters[attr.key]?.includes(opt) || false}
                                onChange={() => toggleSpecFilter(attr.key, opt)}
                                className="small text-dark m-0" style={{ fontSize:'0.82rem' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <hr className="my-2" />

                {/* Price range presets */}
                <div className="mb-3 border-top pt-3">
                  <SectionHead>PRICE (₹)</SectionHead>
                  <div className="d-flex flex-column gap-2 mt-2 ps-1">
                    {PRICE_RANGES.map(r => (
                      <Form.Check 
                        key={r.label}
                        type="radio"
                        name="priceRange"
                        id={`price-${r.label}`}
                        label={r.label}
                        checked={minPriceFilter===r.min && maxPriceFilter===r.max}
                        onChange={() => setMultiParams({ minPrice:r.min, maxPrice:r.max })}
                        className="small text-dark" style={{ fontSize:'0.82rem' }}
                      />
                    ))}
                  </div>
                  {/* Custom inputs */}
                  <div className="d-flex gap-1 align-items-center mt-3">
                    <Form.Control type="number" placeholder="Min" value={minPriceFilter}
                      onChange={e => setParam('minPrice', e.target.value)}
                      className="form-control-earthy py-1 px-2" size="sm" />
                    <span className="text-muted small">–</span>
                    <Form.Control type="number" placeholder="Max" value={maxPriceFilter}
                      onChange={e => setParam('maxPrice', e.target.value)}
                      className="form-control-earthy py-1 px-2" size="sm" />
                  </div>
                </div>

                <hr className="my-2" />

                {/* Availability & Offers */}
                <div className="mb-3 border-top pt-3">
                  <SectionHead>AVAILABILITY & OFFERS</SectionHead>
                  <div className="d-flex flex-column gap-2 mt-2 ps-1">
                    <Form.Check type="checkbox" id="sbInStock" label="In Stock Only"
                      checked={inStockFilter} onChange={e => toggleParam('inStock', e.target.checked)}
                      className="small text-dark" style={{ fontSize:'0.82rem' }} />
                    <Form.Check type="checkbox" id="sbDiscount" label="On Sale / Discounted"
                      checked={hasDiscountFilter} onChange={e => toggleParam('hasDiscount', e.target.checked)}
                      className="small text-dark" style={{ fontSize:'0.82rem' }} />
                    <Form.Check type="checkbox" id="sbFeatured" label="Featured Products"
                      checked={featuredFilter} onChange={e => toggleParam('featuredOnly', e.target.checked)}
                      className="small text-dark" style={{ fontSize:'0.82rem' }} />
                  </div>
                </div>

                <hr className="my-2" />

                {/* Keyword search */}
                <div>
                  <SectionHead>Keyword Search</SectionHead>
                  <div className="position-relative">
                    <Form.Control type="text" placeholder="e.g. headphones..."
                      value={searchFilter} onChange={e => setParam('search', e.target.value)}
                      className="form-control-earthy py-1 px-2" size="sm" style={{ fontSize:'0.82rem' }} />
                    {searchFilter && (
                      <button onClick={() => setParam('search','')}
                        className="btn border-0 bg-transparent position-absolute end-0 top-50 translate-middle-y pe-2 text-muted small">✕</button>
                    )}
                  </div>
                </div>

              </div>
            </Card>
          </Col>

          {/* ── Product grid ────────────────────────────────────── */}
          <Col xs={12} lg={9} className="grid-custom">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">
                Showing <strong>{pagination.total}</strong> product{pagination.total !== 1 ? 's' : ''}
              </span>
              {/* Quick sort pill for convenience */}
              <Form.Select size="sm" value={sortByFilter} onChange={e => setParam('sortBy', e.target.value)}
                className="form-control-earthy" style={{ width:'auto', fontSize:'0.8rem' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </div>
            <ActiveChips />
            <ProductGrid cols={{ xs:6, sm:6, md:4, lg:4 }} />
          </Col>
        </Row>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
      GUEST LAYOUT — horizontal filter bar + 4-col full-width grid
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="py-3">
      <CategoryBar />
      <Banners />

      {/* Horizontal filter toolbar */}
      <div className="bg-white border rounded-2 shadow-sm mb-3 px-3 py-2 d-flex align-items-center flex-wrap gap-2">
        <FilterDropdown label={sortByFilter ? SORT_OPTIONS.find(o=>o.value===sortByFilter)?.label : 'Sort By'} icon="↕" active={!!sortByFilter}>
          {SORT_OPTIONS.map(o => <DropdownItem key={o.value} label={o.label} active={sortByFilter===o.value} onClick={() => setParam('sortBy', o.value)} />)}
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
        )})}

        <FilterDropdown label={pricePillLabel} icon="₹" active={!!(minPriceFilter||maxPriceFilter)}>
          {PRICE_RANGES.map(r => (
            <DropdownItem key={r.label} label={r.label} active={minPriceFilter===r.min && maxPriceFilter===r.max}
              onClick={() => setMultiParams({ minPrice:r.min, maxPrice:r.max })} />
          ))}
          <div className="px-3 pt-2 border-top mt-1" onClick={e => e.stopPropagation()}>
            <p className="small text-muted mb-1 fw-semibold">Custom</p>
            <div className="d-flex gap-1 align-items-center">
              <input type="number" placeholder="Min" value={minPriceFilter} onChange={e => setParam('minPrice', e.target.value)}
                className="form-control form-control-sm" style={{ width:'75px' }} />
              <span className="text-muted small">–</span>
              <input type="number" placeholder="Max" value={maxPriceFilter} onChange={e => setParam('maxPrice', e.target.value)}
                className="form-control form-control-sm" style={{ width:'75px' }} />
            </div>
          </div>
        </FilterDropdown>

        <button onClick={() => toggleParam('hasDiscount', !hasDiscountFilter)}
          className={`btn btn-sm px-3 py-1 rounded-2 border ${hasDiscountFilter ? 'btn-danger text-white' : 'btn-light border-secondary text-dark'}`}
          style={{ fontWeight:600, fontSize:'0.82rem' }}>🏷️ On Sale</button>

        <button onClick={() => toggleParam('inStock', !inStockFilter)}
          className={`btn btn-sm px-3 py-1 rounded-2 border ${inStockFilter ? 'btn-success text-white' : 'btn-light border-secondary text-dark'}`}
          style={{ fontWeight:600, fontSize:'0.82rem' }}>✅ In Stock</button>

        <button onClick={() => toggleParam('featuredOnly', !featuredFilter)}
          className={`btn btn-sm px-3 py-1 rounded-2 border ${featuredFilter ? 'btn-warning text-dark' : 'btn-light border-secondary text-dark'}`}
          style={{ fontWeight:600, fontSize:'0.82rem' }}>⭐ Featured</button>

        <div className="position-relative ms-auto" style={{ minWidth:'195px' }}>
          <Form.Control type="text" placeholder="🔍 Search products..." value={searchFilter}
            onChange={e => setParam('search', e.target.value)}
            className="form-control-earthy py-1 pe-4" size="sm" />
          {searchFilter && (
            <button onClick={() => setParam('search','')}
              className="btn border-0 bg-transparent position-absolute end-0 top-50 translate-middle-y pe-2 text-muted small">✕</button>
          )}
        </div>

        <span className="text-muted small text-nowrap">{pagination.total} results</span>
        {hasAnyFilter && (
          <button onClick={clearAllFilters} className="btn btn-link btn-sm text-danger p-0 text-decoration-none fw-bold small text-nowrap">
            Clear All ✕
          </button>
        )}
      </div>

      <ActiveChips />
      <ProductGrid cols={{ xs:6, sm:4, md:3 }} />
    </div>
  );
};

export default Home;
