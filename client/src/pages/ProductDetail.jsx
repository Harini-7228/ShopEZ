import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Table, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductById, getRelatedProducts, getProducts } from '../api/productsApi';
import { getProductReviews, createReview, deleteReview } from '../api/reviewsApi';
import { toggleWishlistItem, getWishlist } from '../api/wishlistApi';
import { subscribeAlert } from '../api/alertsApi';
import { toast } from 'react-hot-toast';
import ProductCard from '../components/product/ProductCard';
import { getProductVariants, getVariantImpact, mergeVariantSpecs } from '../utils/productVariants';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { fetchWishlist: refreshWishlistContext } = useWishlist();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Myntra-inspired image selector state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic Product Variant state
  const [selectedVariant, setSelectedVariant] = useState('');
  
  // Image zoom state
  const [zoomPosition, setZoomPosition] = useState(null);

  const variantImpact = getVariantImpact(product, selectedVariant);
  const baseDiscountPrice = product?.discountPrice;
  const basePrice = product?.price || 0;

  const displayPrice = baseDiscountPrice 
    ? baseDiscountPrice + variantImpact.priceOffset 
    : basePrice + variantImpact.priceOffset;

  const displayOriginalPrice = basePrice + variantImpact.priceOffset;

  const displaySpecs = mergeVariantSpecs(product?.specifications || {}, variantImpact.specs);
  const [alertType, setAlertType] = useState('price_drop');
  const [targetPrice, setTargetPrice] = useState('');
  
  // Image zoom handler
  const handleImageZoom = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setZoomPosition({ x, y });
  };
  
  // Review writing state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadData = async () => {
    setLoading(true); // Set loading at start
    
    // 1. Fetch Product FIRST
    let currentProduct = null;
    try {
      const prodRes = await getProductById(id);
      if (prodRes && prodRes.success) {
        currentProduct = prodRes.data;
        setProduct(prodRes.data);
        setTargetPrice(Math.round(prodRes.data.price * 0.9));
        
        // Dynamically initialize selected variant
        const variantsInfo = getProductVariants(prodRes.data);
        setSelectedVariant(variantsInfo.options[0] || '');
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      toast.error(err.response?.data?.message || 'Failed to load product details');
      setLoading(false); // Set loading false on error
      return; // Exit if product fails to load
    }

    // 2. Fetch Reviews
    try {
      const revRes = await getProductReviews(id);
      if (revRes && revRes.success) {
        setReviews(revRes.data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }

    // 3. Fetch Wishlist (if customer)
    if (user && user.role === 'customer') {
      try {
        const wishRes = await getWishlist();
        if (wishRes && wishRes.success) {
          setWishlistIds(wishRes.data.items.map((i) => i.productId._id || i.productId));
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      }
    }

    // 4. Fetch Related Products
    if (currentProduct && currentProduct.category?._id) {
      try {
        const relRes = await getRelatedProducts(currentProduct.category._id, id);
        if (relRes.success && relRes.data && relRes.data.length > 0) {
          setRelatedProducts(relRes.data.slice(0, 4));
        } else {
          // Targeted fallback: fetch by category directly, not all 100 products
          const fallbackRes = await getProducts({
            category: currentProduct.category._id,
            limit: 5,
            status: 'active',
          });
          if (fallbackRes.success && fallbackRes.data?.products) {
            setRelatedProducts(
              fallbackRes.data.products
                .filter((p) => p._id !== id)
                .slice(0, 4)
            );
          }
        }
      } catch (err) {
        console.error('Failed to load related products:', err);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    setActiveImageIndex(0); // reset image index on product change
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      toast.error('Only customers can purchase items');
      return;
    }
    await addToCart(product._id, quantity);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      toast.error('Only customers can manage wishlists');
      return;
    }
    try {
      const res = await toggleWishlistItem(product._id);
      if (res && res.success) {
        setWishlistIds(res.data.items.map((i) => i.productId._id || i.productId));
        refreshWishlistContext(); // Update navbar badge
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wishlist action failed');
    }
  };

  const handleSubscribeAlert = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const payload = {
        productId: product._id,
        type: alertType,
        targetPrice: alertType === 'price_drop' ? parseFloat(targetPrice) : undefined,
      };
      const res = await subscribeAlert(payload);
      if (res && res.success) {
        toast.success(res.message || 'Subscribed successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe to alert');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!comment.trim()) {
      setReviewError('Please enter a review comment');
      return;
    }

    try {
      const res = await createReview({
        productId: product._id,
        rating,
        comment,
      });

      if (res && res.success) {
        toast.success('Review submitted successfully');
        setComment('');
        await loadData();
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Delete this review?')) {
      try {
        const res = await deleteReview(reviewId);
        if (res && res.success) {
          toast.success('Review deleted');
          await loadData();
        }
      } catch (err) {
        toast.error('Failed to delete review');
      }
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-75">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-3 text-center text-muted">
        <h4>Product Not Found</h4>
        <Link to="/products" className="btn-earthy mt-3">Back to Browse</Link>
      </Container>
    );
  }

  const isWishlisted = wishlistIds.includes(product._id);
  const inStock = product.stock > 0;
  const { label: variantLabel, options: variantOptions } = getProductVariants(product);
  const categoryId = product.category?.parentCategory || product.category?._id || product.category;
  const isProductListingPath = (path) => {
    if (typeof path !== 'string') return false;
    try {
      return new URL(path, window.location.origin).pathname === '/products';
    } catch {
      return false;
    }
  };
  const stateListingPath = isProductListingPath(location.state?.from) ? location.state.from : '';
  const storedListingPath = sessionStorage.getItem('lastProductListingPath') || '';
  const savedListingPath = stateListingPath || (isProductListingPath(storedListingPath) ? storedListingPath : '');
  const backToListingsPath = savedListingPath || (categoryId ? `/products?category=${categoryId}` : '/products');

  // Fallback images array
  const defaultImages = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&auto=format&fit=crop&q=80'
  ];
  const galleryImages = product.images && product.images.length > 0 ? product.images : defaultImages;

  return (
    <Container className="py-2">
      {/* Back button */}
      <div className="mb-2">
        <Link to={backToListingsPath} className="text-decoration-none small text-muted">&larr; Back to Listings</Link>
      </div>

      <Row className="mb-2">
        {/* Myntra-style Image Gallery Selector */}
        <Col lg={6} className="mb-3 mb-lg-0">
          <Card className="border-0 shadow-sm overflow-hidden p-2 bg-white" style={{ borderRadius: '20px' }}>
            <div 
              className="product-image-container"
              onMouseMove={(e) => handleImageZoom(e)}
              onMouseLeave={() => setZoomPosition(null)}
            >
              <Card.Img
                variant="top"
                src={galleryImages[activeImageIndex]}
                style={{ 
                  objectFit: 'cover', 
                  height: '300px', 
                  borderRadius: '16px',
                  transform: zoomPosition 
                    ? `scale(1.5) translate(${-zoomPosition.x * 0.2}px, ${-zoomPosition.y * 0.2}px)` 
                    : 'scale(1)',
                  transformOrigin: 'center',
                  transition: zoomPosition ? 'none' : 'transform 0.3s ease',
                  cursor: zoomPosition ? 'zoom-in' : 'pointer'
                }}
              />
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <div className="position-absolute" style={{ top: '10px', left: '10px' }}>
                <Alert variant="warning" className="py-1 px-2 small mb-0">
                  ⚠️ Only {product.stock} left!
                </Alert>
              </div>
            )}
          </Card>
          
          {/* Gallery Thumbnails Selector */}
          <div className="d-flex mt-2 justify-content-start flex-wrap">
            {galleryImages.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`product thumbnail ${index}`}
                className={`thumbnail-img ${activeImageIndex === index ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(index)}
              />
            ))}
          </div>
        </Col>
        
        {/* Product Details, Variants and Action Buttons */}
        <Col lg={6}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <Badge bg="secondary" className="badge-status">
              {product.category?.name}
            </Badge>
            {product.isLocalListing && (
              <Badge bg="success" className="badge-status">
                Featured Product
              </Badge>
            )}
          </div>
          
          <h2 className="fw-extrabold text-dark mb-1 fs-4" style={{ fontWeight: '800' }}>{product.name}</h2>
          <p className="text-muted small mb-2">Product SKU Code: <code className="text-dark bg-light px-2 py-1 rounded" style={{ fontSize: '0.75rem' }}>{product.sku}</code></p>
          
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="fs-3 fw-bold text-dark">
              ₹{displayPrice}
            </span>
            {baseDiscountPrice && (
              <span className="text-decoration-line-through text-muted fs-5">
                ₹{displayOriginalPrice}
              </span>
            )}
          </div>

          <div className="mb-2">
            <h6 className="fw-bold text-muted small mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</h6>
            <p className="text-dark" style={{ fontSize: '0.95rem' }}>{product.description || 'No description listed by the seller.'}</p>
          </div>

          {/* Dynamic Product Variant/Option Selector */}
          {variantOptions && variantOptions.length > 0 && (
            <div className="mb-2">
              <h6 className="fw-bold text-muted small mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{variantLabel}</h6>
              <div>
                {variantOptions.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className={`variant-pill ${selectedVariant === variant ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                    style={{ padding: '0.25rem 0.7rem', fontSize: '0.8rem' }}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Availability and Cart checkout selectors */}
          <div className="p-2 bg-light rounded-4 border border-clay mb-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-semibold text-muted">Availability</span>
              <Badge bg={inStock ? 'success' : 'secondary'} className="badge-status" style={{ fontSize: '0.7rem' }}>
                {inStock ? `${product.stock} units available` : 'Out of Stock'}
              </Badge>
            </div>

            {inStock && (!user || user.role === 'customer') && (
              <div className="d-flex gap-2 align-items-center">
                <Form.Group className="d-flex align-items-center" style={{ width: '110px' }}>
                  <Form.Label className="small fw-bold text-muted me-2 mb-0" style={{ fontSize: '0.75rem' }}>Qty</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value, 10))))}
                    className="form-control-earthy py-1 px-2 text-center"
                    style={{ height: '35px', fontSize: '0.85rem' }}
                  />
                </Form.Group>
                
                <Button onClick={handleAddToCart} className="btn-earthy flex-grow-1 py-1" style={{ fontSize: '0.85rem' }}>
                  Add to Cart
                </Button>
                
                <Button variant="outline-danger" onClick={handleToggleWishlist} className="p-2 border-clay" style={{ borderRadius: '30px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isWishlisted ? '❤️' : '🖤'}
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Specifications, Merchant & Alerts Sub-section */}
      <Row className="mb-3 border-top pt-2 gy-2">
        {/* Card 1: Specifications */}
        <Col lg={4} md={6} className="d-flex">
          {displaySpecs && Object.keys(displaySpecs).length > 0 ? (
            <Card className="card-earthy p-3 border-0 bg-white shadow-sm w-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
              <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                <span>📋</span> Specifications
              </h5>
              <div className="d-flex flex-column gap-2 flex-grow-1">
                {Object.entries(displaySpecs).map(([key, val]) => (
                  <div key={key} className="d-flex justify-content-between align-items-center border-bottom pb-1">
                    <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                      {key}
                    </span>
                    <span className="text-dark fw-bold small text-end" style={{ maxWidth: '60%', fontSize: '0.8rem' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="card-earthy p-3 border-0 bg-white shadow-sm w-100 d-flex align-items-center justify-content-center" style={{ borderRadius: '16px', minHeight: '150px' }}>
              <span className="text-muted small">No specifications listed.</span>
            </Card>
          )}
        </Col>

        {/* Card 2: Shop Merchant Info */}
        <Col lg={4} md={6} className="d-flex">
          {product.sellerId ? (
            <Card className="card-earthy p-3 border-0 bg-white shadow-sm w-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
              <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                <span>🏪</span> Merchant Shop
              </h5>
              <div className="d-flex flex-column align-items-center text-center justify-content-center flex-grow-1 py-1">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold mb-2 shadow-sm" style={{ width: '50px', height: '50px', fontSize: '1.2rem', border: '1px solid rgba(30, 58, 138, 0.15)' }}>
                  {product.sellerId.name.charAt(0).toUpperCase()}
                </div>
                <h6 className="fw-bold text-dark mb-1 fs-6" style={{ fontSize: '0.85rem' }}>{product.sellerId.name}</h6>
                <span className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>{product.sellerId.email}</span>
                <Badge bg="success" className="badge-status px-2 py-1 fw-bold mb-1" style={{ fontSize: '0.7rem', borderRadius: '4px' }}>
                  Trust Rating: {product.sellerId.sellerImpactScore} / 100
                </Badge>
                <span className="small text-muted" style={{ fontSize: '0.7rem' }}>🛡️ Verified Merchant</span>
              </div>
            </Card>
          ) : (
            <Card className="card-earthy p-3 border-0 bg-white shadow-sm w-100 d-flex align-items-center justify-content-center" style={{ borderRadius: '16px', minHeight: '150px' }}>
              <span className="text-muted small">No merchant details.</span>
            </Card>
          )}
        </Col>

        {/* Card 3: Price Alerts */}
        <Col lg={4} md={12} className="d-flex">
          {(!user || user.role === 'customer') ? (
            <Card className="card-earthy p-3 border-0 bg-white shadow-sm w-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
              <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                <span>🔔</span> Price Alerts
              </h5>
              <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>Get notified when price drops or restocks.</p>
              <Form onSubmit={handleSubscribeAlert} className="d-flex flex-column justify-content-between flex-grow-1">
                <div className="mb-2">
                  <Form.Group className="mb-1" controlId="alertType">
                    <Form.Label className="small text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Alert Type</Form.Label>
                    <Form.Select
                      value={alertType}
                      onChange={(e) => setAlertType(e.target.value)}
                      className="form-control-earthy py-1 px-2 small"
                      style={{ height: '35px', fontSize: '0.75rem' }}
                    >
                      <option value="price_drop">Price Drop</option>
                      <option value="back_in_stock">Back In Stock</option>
                    </Form.Select>
                  </Form.Group>

                  {alertType === 'price_drop' && (
                    <Form.Group controlId="alertPrice">
                      <Form.Label className="small text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Target Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Price"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="form-control-earthy py-1 px-2 small"
                        style={{ height: '35px', fontSize: '0.75rem' }}
                      />
                    </Form.Group>
                  )}
                </div>
                
                <Button type="submit" className="btn-earthy-outline w-100 py-1 mt-auto d-flex align-items-center justify-content-center" style={{ fontSize: '0.8rem' }}>
                  Notify Me
                </Button>
              </Form>
            </Card>
          ) : (
            <Card className="card-earthy p-3 border-0 bg-light bg-opacity-50 w-100 d-flex align-items-center justify-content-center text-center" style={{ borderRadius: '16px', minHeight: '150px' }}>
              <span className="text-muted small" style={{ fontSize: '0.8rem' }}>Merchant controls active.<br/>Price alerts disabled for sellers.</span>
            </Card>
          )}
        </Col>
      </Row>

      {/* Reviews Listings */}
      <Row className="mt-2">
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1rem' }}>Customer Reviews ({reviews.length})</h4>
            {product.ratingsCount > 0 && (
              <span className="fw-bold text-warning" style={{ fontSize: '0.85rem' }}>
                {'★'.repeat(Math.round(product.ratingsAvg))}{'☆'.repeat(5 - Math.round(product.ratingsAvg))}{' '}
                <span className="text-muted small">({product.ratingsAvg} / 5.0)</span>
              </span>
            )}
          </div>

          {/* Add Review */}
          {user && user.role === 'customer' && (
            <Card className="card-earthy p-3 mb-2">
              <h5 className="fw-semibold text-dark mb-2" style={{ fontSize: '0.9rem' }}>Add a Review</h5>
              {reviewError && <Alert variant="danger" className="py-1 small mb-2">{reviewError}</Alert>}
              <Form onSubmit={handleReviewSubmit}>
                <Form.Group className="mb-2" controlId="reviewRating">
                  <Form.Label className="small fw-semibold text-muted" style={{ fontSize: '0.75rem' }}>Rating</Form.Label>
                  <Form.Select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value, 10))}
                    className="form-control-earthy"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', height: '35px' }}
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Good</option>
                    <option value={2}>2 Stars - Fair</option>
                    <option value={1}>1 Star - Poor</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-2" controlId="reviewComment">
                  <Form.Label className="small fw-semibold text-muted" style={{ fontSize: '0.75rem' }}>Write comment *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Share your feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control-earthy"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                  />
                </Form.Group>

                <Button type="submit" className="btn-earthy px-3 py-1" style={{ fontSize: '0.8rem' }}>
                  Publish Review
                </Button>
              </Form>
            </Card>
          )}

          {/* List reviews */}
          {reviews.length > 0 ? (
            <ListGroup variant="flush" className="bg-white border rounded shadow-sm">
              {reviews.map((rev) => (
                <ListGroup.Item key={rev._id} className="p-2" style={{ fontSize: '0.85rem' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div>
                      <strong style={{ fontSize: '0.8rem' }}>{rev.userId?.name || 'Customer'}</strong>
                      <span className="text-warning ms-2" style={{ fontSize: '0.75rem' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                    {user && (user._id === rev.userId?._id || user.role === 'admin') && (
                      <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDeleteReview(rev._id)} style={{ fontSize: '0.75rem' }}>
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="small text-muted mb-0" style={{ fontSize: '0.8rem' }}>{rev.comment}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="p-2 bg-light text-center border rounded text-muted small" style={{ fontSize: '0.85rem' }}>
              No customer reviews submitted yet.
            </div>
          )}
        </Col>
      </Row>

      {/* Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <Container className="my-2">
          <hr className="my-2" />
          <h4 className="fw-bold text-dark mb-3" style={{ fontSize: '1.2rem' }}>🔍 Related Products</h4>
          <Row className="gy-1">
            {relatedProducts.map((relProduct) => (
              <Col xs={12} sm={6} md={3} key={relProduct._id}>
                <ProductCard product={relProduct} showDetails={true} />
              </Col>
            ))}
          </Row>
        </Container>
      )}
    </Container>
  );
};

export default ProductDetail;

