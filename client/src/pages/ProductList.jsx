import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, Pagination } from 'react-bootstrap';
import { getProducts } from '../api/products';
import apiClient from '../api/apiClient';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, pages: 1, total: 0 });

  // Filter state synced with searchParams
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    inStock: searchParams.get('inStock') === 'true',
    featuredOnly: searchParams.get('featuredOnly') === 'true' || searchParams.get('localOnly') === 'true',
  });

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

  // Update filters if searchParams change
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      search: searchParams.get('search') || '',
      inStock: searchParams.get('inStock') === 'true',
      featuredOnly: searchParams.get('featuredOnly') === 'true' || searchParams.get('localOnly') === 'true',
    });
  }, [searchParams]);

  // Load products based on filter changes and page updates
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const queryParams = {
          page: searchParams.get('page') || 1,
          limit: 8,
        };

        if (filters.category) queryParams.category = filters.category;
        if (filters.minPrice) queryParams.minPrice = filters.minPrice;
        if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice;
        if (filters.search) queryParams.search = filters.search;
        if (filters.inStock) queryParams.inStock = 'true';
        if (filters.featuredOnly) queryParams.featuredOnly = 'true'; // fits synonym mappings

        const res = await getProducts(queryParams);
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
  }, [filters, searchParams]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFilters((prev) => ({ ...prev, [name]: val }));

    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    if (type === 'checkbox') {
      if (val) {
        newParams.set(name, 'true');
      } else {
        newParams.delete(name);
      }
    } else {
      if (value) {
        newParams.set(name, value);
      } else {
        newParams.delete(name);
      }
    }
    setSearchParams(newParams);
  };

  const removeFilterParam = (key) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (pageNo) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNo.toString());
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      inStock: false,
      featuredOnly: false,
    });
    setSearchParams({});
  };

  // Find category name by ID for active filters display
  const getCategoryName = (catId) => {
    const found = categories.find((c) => c._id === catId);
    return found ? found.name : 'Category';
  };

  // Helper to determine if any filters are active
  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.search || 
    filters.inStock || 
    filters.featuredOnly;

  return (
    <Container className="py-4">
      <Row>
        {/* Filters Sidebar */}
        <Col lg={3} className="mb-4">
          <Card className="card-earthy p-3 border-0 bg-white shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-transparent border-0 ps-0 fw-bold fs-5 text-dark d-flex justify-content-between align-items-center">
              <span>Filter Catalog</span>
              {hasActiveFilters && (
                <Button variant="link" size="sm" className="text-danger p-0 text-decoration-none small fw-bold" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </Card.Header>
            <Card.Body className="p-0 pt-2">
              <Form>
                <Form.Group className="mb-3" controlId="filterCategory">
                  <Form.Label className="small fw-bold text-muted">Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="form-control-earthy"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Price Range</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      name="minPrice"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      className="form-control-earthy py-1"
                    />
                    <Form.Control
                      type="number"
                      name="maxPrice"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      className="form-control-earthy py-1"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="filterSearch">
                  <Form.Label className="small fw-bold text-muted">Keyword Search</Form.Label>
                  <Form.Control
                    type="text"
                    name="search"
                    placeholder="e.g. fashion, shoes"
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="form-control-earthy"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="filterInStock">
                  <Form.Check
                    type="checkbox"
                    name="inStock"
                    label="In Stock Only"
                    checked={filters.inStock}
                    onChange={handleFilterChange}
                    className="small fw-semibold text-dark"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="filterFeaturedOnly">
                  <Form.Check
                    type="checkbox"
                    name="featuredOnly"
                    label="Featured Premium Items"
                    checked={filters.featuredOnly}
                    onChange={handleFilterChange}
                    className="small fw-bold text-success"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Product Catalog */}
        <Col lg={9}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0 text-dark">Browse Products</h4>
            <span className="small text-muted">{pagination.total} items listed</span>
          </div>

          {/* Flipkart-style Active Filters Badges */}
          {hasActiveFilters && (
            <div className="d-flex flex-wrap gap-2 mb-4 align-items-center bg-white p-3 border border-clay rounded-3 shadow-sm">
              <span className="small fw-bold text-muted me-1">Active Filters:</span>
              
              {filters.search && (
                <Badge bg="light" className="text-dark border p-2 font-weight-normal align-items-center d-flex gap-1" style={{ fontSize: '0.8rem', borderRadius: '30px' }}>
                  Search: "{filters.search}"
                  <span className="text-danger fw-bold cursor-pointer ms-1" style={{ cursor: 'pointer' }} onClick={() => removeFilterParam('search')}>&times;</span>
                </Badge>
              )}
              {filters.category && (
                <Badge bg="light" className="text-dark border p-2 align-items-center d-flex gap-1" style={{ fontSize: '0.8rem', borderRadius: '30px' }}>
                  Category: {getCategoryName(filters.category)}
                  <span className="text-danger fw-bold cursor-pointer ms-1" style={{ cursor: 'pointer' }} onClick={() => removeFilterParam('category')}>&times;</span>
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge bg="light" className="text-dark border p-2 align-items-center d-flex gap-1" style={{ fontSize: '0.8rem', borderRadius: '30px' }}>
                  Price: ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || 'Any'}
                  <span className="text-danger fw-bold cursor-pointer ms-1" style={{ cursor: 'pointer' }} onClick={() => { removeFilterParam('minPrice'); removeFilterParam('maxPrice'); }}>&times;</span>
                </Badge>
              )}
              {filters.inStock && (
                <Badge bg="light" className="text-dark border p-2 align-items-center d-flex gap-1" style={{ fontSize: '0.8rem', borderRadius: '30px' }}>
                  In Stock Only
                  <span className="text-danger fw-bold cursor-pointer ms-1" style={{ cursor: 'pointer' }} onClick={() => removeFilterParam('inStock')}>&times;</span>
                </Badge>
              )}
              {filters.featuredOnly && (
                <Badge bg="success" className="text-white p-2 align-items-center d-flex gap-1" style={{ fontSize: '0.8rem', borderRadius: '30px' }}>
                  ✨ Featured Listings
                  <span className="text-white fw-bold cursor-pointer ms-1" style={{ cursor: 'pointer' }} onClick={() => { removeFilterParam('featuredOnly'); removeFilterParam('localOnly'); }}>&times;</span>
                </Badge>
              )}
            </div>
          )}

          {loading ? (
            <Row className="gy-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Col key={n} xs={12} sm={6} md={4}>
                  <Card className="card-earthy h-100 p-3">
                    <div className="placeholder-glow">
                      <div className="placeholder col-12 mb-3" style={{ height: '180px' }}></div>
                      <div className="placeholder col-8 mb-2"></div>
                      <div className="placeholder col-5"></div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : products.length > 0 ? (
            <>
              <Row className="gy-4">
                {products.map((product) => (
                  <Col key={product._id} xs={12} sm={6} md={4}>
                    <Card className="card-earthy h-100 flex-column border-0">
                      <div className="position-relative overflow-hidden" style={{ borderRadius: '16px 16px 0 0' }}>
                        <Card.Img
                          variant="top"
                          src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                          style={{ height: '220px', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                          className="hover-zoom-img"
                        />
                        {product.isLocalListing && (
                          <Badge bg="success" className="position-absolute m-3 top-0 start-0 badge-status">
                            Featured
                          </Badge>
                        )}
                        {product.stock <= 0 && (
                          <Badge bg="secondary" className="position-absolute m-3 top-0 end-0 badge-status">
                            Out of stock
                          </Badge>
                        )}
                      </div>
                      <Card.Body className="d-flex flex-column p-4">
                        <Card.Title className="fs-6 fw-bold mb-2 text-dark text-truncate">
                          <Link to={`/products/${product._id}`} className="text-decoration-none text-dark hover-text-primary">
                            {product.name}
                          </Link>
                        </Card.Title>
                        <Card.Text className="small text-muted mb-3 text-truncate-2" style={{ height: '36px', overflow: 'hidden' }}>
                          {product.description}
                        </Card.Text>
                        <div className="mt-auto pt-2 border-top border-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-bold text-dark fs-5">
                                ₹{product.discountPrice || product.price}
                              </span>
                              {product.discountPrice && (
                                <span className="text-decoration-line-through text-muted small ms-2" style={{ fontSize: '0.75rem' }}>
                                  ₹{product.price}
                                </span>
                              )}
                            </div>
                            <Button as={Link} to={`/products/${product._id}`} className="btn-earthy btn-sm py-1 px-3 text-white small">
                              Details
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                  <Pagination>
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
            <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
              <div className="fs-1 mb-3">🛍️</div>
              <h5>No Products Found</h5>
              <p className="small mb-0">Try clearing active filters or modifying search keywords.</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductList;
