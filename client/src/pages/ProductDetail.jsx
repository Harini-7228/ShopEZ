import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Table, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProductById } from '../api/products';
import { getProductReviews, createReview, deleteReview } from '../api/reviews';
import { toggleWishlistItem, getWishlist } from '../api/wishlist';
import { subscribeAlert } from '../api/alerts';
import { toast } from 'react-hot-toast';

const getProductVariants = (product) => {
  if (!product) return { label: 'Select Option', options: ['Standard'] };

  const name = product.name || '';
  const categoryName = product.category?.name || '';
  const specs = product.specifications || {};

  // 1. Check fashion products
  if (categoryName.toLowerCase().includes('fashion') || name.includes('Shoes') || name.includes('Jacket') || name.includes('Hoodie') || name.includes('Dress') || name.includes('Scarf')) {
    if (name.includes('Shoes') || name.includes('Oxford') || name.includes('Running')) {
      return {
        label: 'Select Size (UK)',
        options: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']
      };
    }
    if (name.includes('Scarf')) {
      return {
        label: 'Select Color',
        options: ['Pink (Standard)', 'Classic Beige', 'Charcoal Gray']
      };
    }
    return {
      label: 'Select Size',
      options: ['Small (S)', 'Medium (M)', 'Large (L)', 'Extra Large (XL)']
    };
  }

  // 2. Check tech / mobiles / electronics
  if (categoryName.toLowerCase().includes('mobiles') || categoryName.toLowerCase().includes('electronics') || categoryName.toLowerCase().includes('gaming') || name.includes('Monitor') || name.includes('Adapter')) {
    if (name.includes('Smartphone') || name.includes('ProMax')) {
      return {
        label: 'Select Storage',
        options: ['128GB Storage', '256GB Storage', '512GB Storage']
      };
    }
    if (name.includes('Headphones') || name.includes('Earbuds') || name.includes('Headset')) {
      return {
        label: 'Select Color',
        options: ['Matte Black', 'Frost White', 'Midnight Blue']
      };
    }
    if (name.includes('Keyboard')) {
      return {
        label: 'Select Switches',
        options: ['Tactile Brown', 'Linear Red', 'Clicky Blue']
      };
    }
    if (name.includes('Tracker') || name.includes('Fitness')) {
      return {
        label: 'Select Strap Color',
        options: ['Classic Black', 'Active Orange', 'Navy Blue']
      };
    }
    if (name.includes('Controller')) {
      return {
        label: 'Select Edition',
        options: ['Pro Wireless', 'Elite Wired']
      };
    }
    if (name.includes('Mouse')) {
      return {
        label: 'Select Color',
        options: ['Stealth Black', 'Pure White']
      };
    }
    if (name.includes('Monitor')) {
      return {
        label: 'Select Screen size',
        options: ['5" IPS Display', '7" IPS High-Def Display']
      };
    }
    if (name.includes('Adapter')) {
      return {
        label: 'Select Power Output',
        options: ['30W Standard', '65W GaN Fast']
      };
    }
  }

  // 3. Check grocery / cosmetics / wellness
  if (categoryName.toLowerCase().includes('grocer') || categoryName.toLowerCase().includes('health') || categoryName.toLowerCase().includes('beauty') || name.includes('Coffee') || name.includes('Honey') || name.includes('Olive Oil') || name.includes('Protein') || name.includes('Serum') || name.includes('Lipstick') || name.includes('Hair Mask')) {
    if (name.includes('Coffee')) {
      return {
        label: 'Select Pack Weight',
        options: ['250g Medium Roast', '500g Value Pack', '1kg Bulk Bag']
      };
    }
    if (name.includes('Honey')) {
      return {
        label: 'Select Net Weight',
        options: ['250g Trial Jar', '500g Classic Jar', '1kg Family Tub']
      };
    }
    if (name.includes('Olive Oil')) {
      return {
        label: 'Select Volume',
        options: ['500ml Bottle', '1L Tin Bottle', '2L Value Can']
      };
    }
    if (name.includes('Protein') || name.includes('Whey')) {
      return {
        label: 'Select Flavor / Pack',
        options: ['Double Rich Chocolate (1kg)', 'French Vanilla Cream (1kg)', 'Double Rich Chocolate (2kg)']
      };
    }
    if (name.includes('Serum')) {
      return {
        label: 'Select Volume',
        options: ['15ml Travel Size', '30ml Standard Bottle', '50ml Double Pack']
      };
    }
    if (name.includes('Lipstick')) {
      return {
        label: 'Select Color Pack',
        options: ['6 Shades Set', 'Single Shade Trial']
      };
    }
    if (name.includes('Hair Mask')) {
      return {
        label: 'Select Jar size',
        options: ['100g Travel Tube', '200g Standard Tub', '500g Salon Pack']
      };
    }
  }

  // 4. Check furniture
  if (categoryName.toLowerCase().includes('furniture')) {
    if (name.includes('Chair')) {
      return {
        label: 'Select Ergonomic Spec',
        options: ['Mesh Lumbar Standard', 'Leatherette High-Back']
      };
    }
    if (name.includes('Organizer')) {
      return {
        label: 'Select Wood Finish',
        options: ['Natural Matte Oak', 'Walnut Matte Finish']
      };
    }
    if (name.includes('Bookshelf')) {
      return {
        label: 'Select Shelves Size',
        options: ['3-Tier Compact', '5-Tier Standard']
      };
    }
    if (name.includes('Mattress')) {
      return {
        label: 'Select Mattress Size',
        options: ['King Size (72" x 78")', 'Queen Size (60" x 78")', 'Single Size (36" x 78")']
      };
    }
  }

  // 5. Check travel
  if (categoryName.toLowerCase().includes('travel')) {
    if (name.includes('Trolley') || name.includes('Bag')) {
      return {
        label: 'Select Trolley Size',
        options: ['Cabin 55cm', 'Medium 65cm', 'Large 75cm']
      };
    }
    if (name.includes('Pillow')) {
      return {
        label: 'Select Pillow Cover Color',
        options: ['Velvet Navy Blue', 'Velvet Slate Gray']
      };
    }
  }

  // 6. Check pets
  if (categoryName.toLowerCase().includes('pet')) {
    if (name.includes('Dog Food') || name.includes('Cat Food')) {
      return {
        label: 'Select Pack Weight',
        options: ['1.2kg Trial Bag', '3kg Standard Bag', '10kg Bulk Saver Pack']
      };
    }
    if (name.includes('Fountain')) {
      return {
        label: 'Select Bundle Pack',
        options: ['2.5L Standard Fountain', '2.5L Fountain + 3 Filter Pack']
      };
    }
  }

  // 7. Check baby & toys
  if (categoryName.toLowerCase().includes('baby') || categoryName.toLowerCase().includes('toys')) {
    if (name.includes('Robot')) {
      return {
        label: 'Select Kit Level',
        options: ['STEM Starter Set', 'STEM Advanced Program Set']
      };
    }
    if (name.includes('Puzzle')) {
      return {
        label: 'Select Theme Pack',
        options: ['5 Themes Set', '3 Themes Starter Set']
      };
    }
    if (name.includes('Car')) {
      return {
        label: 'Select Remote Car Color',
        options: ['Racing Blue', 'Stealth Black', 'Speed Fire Red']
      };
    }
    if (name.includes('Bodysuit') || name.includes('onesies')) {
      return {
        label: 'Select Baby Age Group',
        options: ['0-3 Months', '3-6 Months', '6-12 Months', '12-18 Months']
      };
    }
  }

  // 8. Check sports
  if (categoryName.toLowerCase().includes('sports')) {
    if (name.includes('Dumbbell')) {
      return {
        label: 'Select Dumbbell Pack',
        options: ['Single Dumbbell (25kg)', 'Dumbbell Pair (25kg x 2)']
      };
    }
    if (name.includes('Yoga')) {
      return {
        label: 'Select Thickness',
        options: ['6mm Standard TPE', '8mm Extra Cushion TPE']
      };
    }
  }

  return {
    label: 'Select Edition',
    options: ['Standard Edition', 'Premium Bundle']
  };
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Myntra-inspired image selector state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic Product Variant state
  const [selectedVariant, setSelectedVariant] = useState('');

  // Alert Subscription state
  const [alertType, setAlertType] = useState('price_drop');
  const [targetPrice, setTargetPrice] = useState('');
  
  // Review writing state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadData = async () => {
    // 1. Fetch Product
    try {
      const prodRes = await getProductById(id);
      if (prodRes && prodRes.success) {
        setProduct(prodRes.data);
        setTargetPrice(Math.round(prodRes.data.price * 0.9));
        
        // Dynamically initialize selected variant
        const variantsInfo = getProductVariants(prodRes.data);
        setSelectedVariant(variantsInfo.options[0] || '');
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      toast.error(err.response?.data?.message || 'Failed to load product details');
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

  // Fallback images array
  const defaultImages = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&auto=format&fit=crop&q=80'
  ];
  const galleryImages = product.images && product.images.length > 0 ? product.images : defaultImages;

  return (
    <Container className="py-4">
      {/* Back button */}
      <div className="mb-4">
        <Link to="/products" className="text-decoration-none small text-muted">&larr; Back to Listings</Link>
      </div>

      <Row className="mb-3">
        {/* Myntra-style Image Gallery Selector */}
        <Col lg={6} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm overflow-hidden p-2 bg-white" style={{ borderRadius: '20px' }}>
            <Card.Img
              variant="top"
              src={galleryImages[activeImageIndex]}
              style={{ objectFit: 'cover', height: '420px', borderRadius: '16px' }}
            />
          </Card>
          
          {/* Gallery Thumbnails Selector */}
          <div className="d-flex mt-3 justify-content-start flex-wrap">
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
          
          <h2 className="fw-extrabold text-dark mb-1 fs-3" style={{ fontWeight: '800' }}>{product.name}</h2>
          <p className="text-muted small mb-3">Product SKU Code: <code className="text-dark bg-light px-2 py-1 rounded">{product.sku}</code></p>
          
          <div className="d-flex align-items-center gap-3 mb-4">
            <span className="fs-2 fw-bold text-dark">
              ₹{product.discountPrice || product.price}
            </span>
            {product.discountPrice && (
              <span className="text-decoration-line-through text-muted fs-4">
                ₹{product.price}
              </span>
            )}
          </div>

          <div className="mb-4">
            <h6 className="fw-bold text-muted small uppercase">Description</h6>
            <p className="text-dark" style={{ fontSize: '0.95rem' }}>{product.description || 'No description listed by the seller.'}</p>
          </div>

          {/* Dynamic Product Variant/Option Selector */}
          {variantOptions && variantOptions.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold text-muted small uppercase mb-2">{variantLabel}</h6>
              <div>
                {variantOptions.map((variant) => (
                  <button
                    key={variant}
                    className={`variant-pill ${selectedVariant === variant ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Availability and Cart checkout selectors */}
          <div className="p-3 bg-light rounded-4 border border-clay mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small fw-semibold text-muted">Availability</span>
              <Badge bg={inStock ? 'success' : 'secondary'} className="badge-status">
                {inStock ? `${product.stock} units available` : 'Out of Stock'}
              </Badge>
            </div>

            {inStock && (!user || user.role === 'customer') && (
              <div className="d-flex gap-2 align-items-center">
                <Form.Group className="d-flex align-items-center" style={{ width: '130px' }}>
                  <Form.Label className="small fw-bold text-muted me-2 mb-0">Qty</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value, 10))))}
                    className="form-control-earthy py-1 px-2 text-center"
                    style={{ height: '38px' }}
                  />
                </Form.Group>
                
                <Button onClick={handleAddToCart} className="btn-earthy flex-grow-1 py-2">
                  Add to Cart
                </Button>
                
                <Button variant="outline-danger" onClick={handleToggleWishlist} className="p-2 border-clay" style={{ borderRadius: '30px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isWishlisted ? '❤️' : '🖤'}
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Specifications, Merchant & Alerts Sub-section */}
      <Row className="mb-4 border-top pt-3 gy-4">
        {/* Card 1: Specifications */}
        <Col lg={4} md={6} className="d-flex">
          {product.specifications && Object.keys(product.specifications).length > 0 ? (
            <Card className="card-earthy p-4 border-0 bg-white shadow-sm w-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <span>📋</span> Specifications
              </h5>
              <div className="d-flex flex-column gap-3 flex-grow-1">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      {key}
                    </span>
                    <span className="text-dark fw-bold small text-end" style={{ maxWidth: '60%' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="card-earthy p-4 border-0 bg-white shadow-sm w-100 d-flex align-items-center justify-content-center" style={{ borderRadius: '16px' }}>
              <span className="text-muted small">No specifications listed.</span>
            </Card>
          )}
        </Col>

        {/* Card 2: Shop Merchant Info */}
        <Col lg={4} md={6} className="d-flex">
          {product.sellerId ? (
            <Card className="card-earthy p-4 border-0 bg-white shadow-sm w-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <span>🏪</span> Merchant Shop
              </h5>
              <div className="d-flex flex-column align-items-center text-center justify-content-center flex-grow-1 py-2">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold mb-3 shadow-sm" style={{ width: '60px', height: '60px', fontSize: '1.5rem', border: '1px solid rgba(30, 58, 138, 0.15)' }}>
                  {product.sellerId.name.charAt(0).toUpperCase()}
                </div>
                <h6 className="fw-bold text-dark mb-1 fs-6">{product.sellerId.name}</h6>
                <span className="small text-muted mb-3">{product.sellerId.email}</span>
                <Badge bg="success" className="badge-status px-3 py-2 fw-bold mb-1" style={{ fontSize: '0.8rem', borderRadius: '6px' }}>
                  Trust Rating: {product.sellerId.sellerImpactScore} / 100
                </Badge>
                <span className="small text-muted" style={{ fontSize: '0.72rem' }}>🛡️ Verified Merchant Partner</span>
              </div>
            </Card>
          ) : (
            <Card className="card-earthy p-4 border-0 bg-white shadow-sm w-100 d-flex align-items-center justify-content-center" style={{ borderRadius: '16px' }}>
              <span className="text-muted small">No merchant details.</span>
            </Card>
          )}
        </Col>

        {/* Card 3: Price Alerts */}
        <Col lg={4} md={12} className="d-flex">
          {(!user || user.role === 'customer') ? (
            <Card className="card-earthy p-4 border-0 bg-white shadow-sm w-100 d-flex flex-column" style={{ borderRadius: '16px' }}>
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <span>🔔</span> Price Alerts
              </h5>
              <p className="text-muted small mb-3">Get notified when the price drops below your target or restocks.</p>
              <Form onSubmit={handleSubscribeAlert} className="d-flex flex-column justify-content-between flex-grow-1">
                <div className="mb-3">
                  <Form.Group className="mb-2" controlId="alertType">
                    <Form.Label className="small text-muted fw-semibold">Alert Type</Form.Label>
                    <Form.Select
                      value={alertType}
                      onChange={(e) => setAlertType(e.target.value)}
                      className="form-control-earthy py-1 px-2 small"
                      style={{ height: '38px', fontSize: '0.88rem' }}
                    >
                      <option value="price_drop">Price Drop</option>
                      <option value="back_in_stock">Back In Stock</option>
                    </Form.Select>
                  </Form.Group>

                  {alertType === 'price_drop' && (
                    <Form.Group controlId="alertPrice">
                      <Form.Label className="small text-muted fw-semibold">Target Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Price"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="form-control-earthy py-1 px-2 small"
                        style={{ height: '38px', fontSize: '0.88rem' }}
                      />
                    </Form.Group>
                  )}
                </div>
                
                <Button type="submit" className="btn-earthy-outline w-100 py-2 mt-auto d-flex align-items-center justify-content-center" style={{ fontSize: '0.85rem' }}>
                  Notify Me
                </Button>
              </Form>
            </Card>
          ) : (
            <Card className="card-earthy p-4 border-0 bg-light bg-opacity-50 w-100 d-flex align-items-center justify-content-center text-center" style={{ borderRadius: '16px' }}>
              <span className="text-muted small">Merchant controls active.<br/>Price alerts disabled for sellers/staff.</span>
            </Card>
          )}
        </Col>
      </Row>

      {/* Reviews Listings */}
      <Row className="mt-5">
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold text-dark mb-0">Customer Reviews ({reviews.length})</h4>
            {product.ratingsCount > 0 && (
              <span className="fw-bold text-warning fs-5">
                {'★'.repeat(Math.round(product.ratingsAvg))}{'☆'.repeat(5 - Math.round(product.ratingsAvg))}{' '}
                <span className="text-muted small">({product.ratingsAvg} / 5.0)</span>
              </span>
            )}
          </div>

          {/* Add Review */}
          {user && user.role === 'customer' && (
            <Card className="card-earthy p-4 mb-4">
              <h5 className="fw-semibold text-dark mb-3">Add a Review</h5>
              {reviewError && <Alert variant="danger" className="py-2 small">{reviewError}</Alert>}
              <Form onSubmit={handleReviewSubmit}>
                <Form.Group className="mb-3" controlId="reviewRating">
                  <Form.Label className="small fw-semibold text-muted">Rating</Form.Label>
                  <Form.Select
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value, 10))}
                    className="form-control-earthy"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Good</option>
                    <option value={2}>2 Stars - Fair</option>
                    <option value={1}>1 Star - Poor</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="reviewComment">
                  <Form.Label className="small fw-semibold text-muted">Write comment *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Did the item live up to expectations? Support verified merchants by leaving feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control-earthy"
                  />
                </Form.Group>

                <Button type="submit" className="btn-earthy px-4">
                  Publish Review
                </Button>
              </Form>
            </Card>
          )}

          {/* List reviews */}
          {reviews.length > 0 ? (
            <ListGroup variant="flush" className="bg-white border rounded shadow-sm">
              {reviews.map((rev) => (
                <ListGroup.Item key={rev._id} className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div>
                      <strong>{rev.userId?.name || 'Customer'}</strong>
                      <span className="text-warning ms-2">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                    {user && (user._id === rev.userId?._id || user.role === 'admin') && (
                      <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDeleteReview(rev._id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="small text-muted mb-0">{rev.comment}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="p-4 bg-light text-center border rounded text-muted small">
              No customer reviews submitted yet.
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
