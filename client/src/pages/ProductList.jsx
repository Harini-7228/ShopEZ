import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, Pagination, Spinner } from 'react-bootstrap';
import { getProducts } from '../api/productsApi';
import apiClient from '../api/apiClient';
import ProductCard from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/common/LoadingSkeleton';

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

/* ── Sidebar section header ── */
const SectionHead = ({ children }) => (
  <p className="text-uppercase fw-bold text-muted mb-2"
    style={{ fontSize: '0.68rem', letterSpacing: '0.07em' }}>
    {children}
  </p>
);

const ProductList = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, pages: 1, total: 0 });

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

  // Filter helpers
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

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        if (res.data && res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  // Hierarchy logic - find active category and its subcategories
  const activeCatObj = categories.find(c => c._id === categoryFilter);
  const activeTopCategoryId = activeCatObj?.parentCategory || categoryFilter;
  const activeTopCategoryName = categories.find(c => c._id === activeTopCategoryId)?.name;
  const currentAttributes = activeTopCategoryName ? ATTRIBUTE_FILTERS[activeTopCategoryName] || [] : [];

  // Load products based on filter changes and page updates
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const q = { page, limit: 12, status: 'active' };
        
        if (categoryFilter) q.category = categoryFilter;
        if (searchFilter) q.search = searchFilter;
        if (minPriceFilter) q.minPrice = minPriceFilter;
        if (maxPriceFilter) q.maxPrice = maxPriceFilter;
        if (inStockFilter) q.inStock = 'true';
        if (hasDiscountFilter) q.hasDiscount = 'true';
        if (featuredFilter) q.featuredOnly = 'true';
        if (sortByFilter) q.sortBy = sortByFilter;
        
        // Add spec filters
        if (Object.keys(specFilters).length > 0) {
          q.specs = {};
          Object.entries(specFilters).forEach(([k, v]) => {
            q.specs[k] = v.join(',');
          });
        }

        const res = await getProducts(q);
        if (res && res.success) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [searchParams]);

  const handlePageChange = (pageNo) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNo.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => setSearchParams({});

  useEffect(() => {
    sessionStorage.setItem('lastProductListingPath', `${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return (
    <Container className="py-3">
      <Row>
        {/* Advanced Filters Sidebar */}
        <Col xs={12} lg={3} className="mb-4">
          <Card className="card-earthy shadow-sm" style={{ position: 'sticky', top: '80px', borderRadius: '12px' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>🎛️ Filters</span>
              {hasAnyFilter && (
                <button onClick={clearAllFilters} className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-bold" style={{ fontSize: '0.75rem' }}>
                  Clear All
                </button>
              )}
            </div>

            <div className="p-3">
              {/* Sort */}
              <div className="mb-3">
                <SectionHead>Sort By</SectionHead>
                <Form.Select size="sm" value={sortByFilter} onChange={e => setParam('sortBy', e.target.value)}
                  className="form-control-earthy py-1" style={{ fontSize: '0.82rem' }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Form.Select>
              </div>

              <hr className="my-2" />

              {/* Dynamic Attributes (Brand, Color, etc. based on category) */}
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
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: opt.toLowerCase() === 'multicolor' ? 'linear-gradient(45deg, red, blue, yellow)' : opt.toLowerCase(), border: '1px solid #ddd' }} />
                                  )}
                                  {opt}
                                </div>
                              }
                              checked={specFilters[attr.key]?.includes(opt) || false}
                              onChange={() => toggleSpecFilter(attr.key, opt)}
                              className="small text-dark m-0" style={{ fontSize: '0.82rem' }}
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
                      checked={minPriceFilter === r.min && maxPriceFilter === r.max}
                      onChange={() => setMultiParams({ minPrice: r.min, maxPrice: r.max })}
                      className="small text-dark" style={{ fontSize: '0.82rem' }}
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
                    className="small text-dark" style={{ fontSize: '0.82rem' }} />
                  <Form.Check type="checkbox" id="sbDiscount" label="On Sale / Discounted"
                    checked={hasDiscountFilter} onChange={e => toggleParam('hasDiscount', e.target.checked)}
                    className="small text-dark" style={{ fontSize: '0.82rem' }} />
                  <Form.Check type="checkbox" id="sbFeatured" label="Featured Products"
                    checked={featuredFilter} onChange={e => toggleParam('featuredOnly', e.target.checked)}
                    className="small text-dark" style={{ fontSize: '0.82rem' }} />
                </div>
              </div>

              <hr className="my-2" />

              {/* Keyword search */}
              <div>
                <SectionHead>Keyword Search</SectionHead>
                <div className="position-relative">
                  <Form.Control type="text" placeholder="e.g. headphones..."
                    value={searchFilter} onChange={e => setParam('search', e.target.value)}
                    className="form-control-earthy py-1 px-2" size="sm" style={{ fontSize: '0.82rem' }} />
                  {searchFilter && (
                    <button onClick={() => setParam('search', '')}
                      className="btn border-0 bg-transparent position-absolute end-0 top-50 translate-middle-y pe-2 text-muted small">✕</button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Product Catalog */}
        <Col xs={12} lg={9} className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem' }}>
              Browse Products
              <span className="small text-muted fw-normal ms-2">({pagination.total} items)</span>
            </h4>
          </div>

          {/* Active Filter Chips */}
          {hasAnyFilter && (
            <div className="d-flex flex-wrap gap-2 mb-3">
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
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted small mt-2">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <Row className="gy-3 gx-3">
                {products.map((product) => (
                  <Col key={product._id} xs={6} sm={6} md={4}>
                    <ProductCard product={product} showDetails={true} />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination size="sm">
                    <Pagination.Prev
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    />
                    {[...Array(pagination.pages).keys()].map((p) => (
                      <Pagination.Item
                        key={p + 1}
                        active={p + 1 === pagination.page}
                        onClick={() => handlePageChange(p + 1)}
                      >
                        {p + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    />
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
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductList;
