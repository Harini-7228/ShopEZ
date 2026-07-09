import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { checkout } from '../api/ordersApi';
import { loadRazorpayScript, openRazorpayCheckout, createRazorpayOrder, verifyRazorpayPayment, RAZORPAY_KEY_ID } from '../api/razorpayApi';
import { Container, Row, Col, Card, Form, Button, Image, Spinner, Alert, ListGroup, Modal } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';

// Helper: safe price — discountPrice=0 must NOT fall back to full price (Fix #2/#17)
const getEffectivePrice = (product) => {
  return (product.discountPrice != null && product.discountPrice > 0)
    ? product.discountPrice
    : product.price;
};

// Fix #1/#8: renderConfirmationView defined BEFORE the component body early-return guards
// to avoid any reference/render-cycle issues.
const OrderConfirmationView = ({ order, paymentMethod }) => (
  <Container className="py-3 text-center d-flex flex-column align-items-center justify-content-center">
    <div className="fs-1 mb-3">🎉</div>
    <h3 className="fw-bold text-success mb-2">Order Confirmed!</h3>
    <p className="lead text-dark">Thank you for shopping with ShopEZ.</p>
    <p className="small text-muted mb-4">
      Order ID:{' '}
      <strong
        className="font-monospace"
        style={{ cursor: 'pointer' }}
        title="Click to copy"
        onClick={() => {
          navigator.clipboard.writeText(order?._id || '');
          toast.success('Order ID copied!');
        }}
      >
        {order?._id}
      </strong>
      <br />
      {paymentMethod === 'cod' ? 'Total Amount to pay:' : 'Total Amount paid:'} <strong>₹{order?.totalAmount?.toFixed(2)}</strong>
    </p>
    <div className="d-flex gap-3">
      <Link to="/" className="btn-earthy-outline">Continue Shopping</Link>
      <Link to="/orders/history" className="btn-earthy">Track Order History</Link>
    </div>
  </Container>
);

const Checkout = () => {
  const { user } = useAuth();
  const { cart, clearCart, fetchCart } = useCart();
  const navigate = useNavigate();

  // Address pre-population from user profiles
  const defaultAddress = user?.addresses && user.addresses[0] ? user.addresses[0] : {};

  const [address, setAddress] = useState({
    street: defaultAddress.street || '',
    city: defaultAddress.city || '',
    state: defaultAddress.state || '',
    zip: defaultAddress.zip || '',
    country: defaultAddress.country || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  
  // Coupon/Promo code state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  
  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState(user?.addresses || []);

  // Load Razorpay script on component mount
  useEffect(() => {
    const loadScript = async () => {
      const isLoaded = await loadRazorpayScript();
      setRazorpayReady(isLoaded);
      if (!isLoaded) {
        console.warn('Razorpay script failed to load');
      }
    };
    loadScript();
  }, []);

  // Coupon validation handler
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    try {
      // Validate coupon via API (you'll need to create this endpoint)
      const res = await apiClient.post('/coupons/validate', {
        code: couponCode,
        amount: subtotal
      });
      
      if (res.data && res.data.success) {
        const discount = res.data.data.discount || 0;
        setCouponDiscount(discount);
        setAppliedCoupon(couponCode);
        toast.success(`Coupon applied! Discount: ₹${discount.toFixed(2)}`);
      } else {
        toast.error(res.data?.message || 'Invalid coupon code');
      }
    } catch (err) {
      // If endpoint doesn't exist yet, show demo message
      if (err.response?.status === 404) {
        toast.error('Coupon system coming soon');
      } else {
        toast.error(err.response?.data?.message || 'Coupon validation failed');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setAppliedCoupon(null);
    toast.success('Coupon removed');
  };

  const handleSelectSavedAddress = (selectedAddr) => {
    setAddress({
      street: selectedAddr.street || '',
      city: selectedAddr.city || '',
      state: selectedAddr.state || '',
      zip: selectedAddr.zip || '',
      country: selectedAddr.country || '',
    });
    setShowAddressModal(false);
    toast.success('Address selected');
  };

  // Fix #1: Check orderConfirmed FIRST before the cart check, to avoid
  if (orderConfirmed) {
    return <OrderConfirmationView order={placedOrderDetails} paymentMethod={paymentMethod} />;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Container className="py-3 text-center text-muted d-flex flex-column align-items-center justify-content-center">
        <h4>No Items in Cart</h4>
        <Link to="/products" className="btn-earthy mt-3">Browse Products</Link>
      </Container>
    );
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const processOrderCheckout = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
      };

      const res = await checkout(payload);
      if (res && res.success) {
        setPlacedOrderDetails(res.data.order);
        setOrderConfirmed(true);
        // Clear customer cart state locally
        await clearCart();
        toast.success('Order checkout completed successfully!');
      } else {
        setError(res.message || 'Failed to place order');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing checkout transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const processRazorpayPayment = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!razorpayReady) {
        setError('Payment gateway not loaded. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      // Step 0: Refresh cart from backend to ensure it's in sync
      await fetchCart();
      
      // Verify cart has items before proceeding
      if (!cart || !cart.items || cart.items.length === 0) {
        setError('Your cart is empty. Please add items before checking out.');
        setSubmitting(false);
        return;
      }

      // Step 1: Create Razorpay order (WITHOUT creating ShopEZ order yet)
      toast.loading('Preparing payment...');
      
      const amount = finalTotal;

      console.log('Creating Razorpay order with amount:', amount);

      // Create Razorpay order
      const razorpayOrderRes = await createRazorpayOrder(amount, appliedCoupon || undefined);
      
      console.log('Razorpay order response:', razorpayOrderRes);

      const razorpayOrderId = razorpayOrderRes.data?.id;
      const razorpayOrderAmount = razorpayOrderRes.data?.amount || amount * 100;

      if (!razorpayOrderId) {
        const errorMsg = razorpayOrderRes.message || 'Failed to create payment order';
        console.error('Razorpay order creation failed:', razorpayOrderRes);
        setError(errorMsg);
        setSubmitting(false);
        toast.dismiss();
        toast.error(errorMsg);
        return;
      }

      toast.dismiss();

      // Step 2: Open Razorpay checkout modal
      const checkoutOptions = {
        key: RAZORPAY_KEY_ID,
        amount: razorpayOrderAmount, // Amount in paise
        currency: 'INR',
        name: 'ShopEZ',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.fullName || user?.email || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
      };

      try {
        const response = await openRazorpayCheckout(checkoutOptions);
        
        // Step 3: Verify payment and create order on backend
        toast.loading('Verifying payment and creating order...');
        const verifyRes = await verifyRazorpayPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          address,
          appliedCoupon || undefined
        );

        toast.dismiss();

        if (verifyRes && verifyRes.success) {
          setPlacedOrderDetails(verifyRes.data.order);
          setOrderConfirmed(true);
          await clearCart();
          toast.success('Payment successful! Order confirmed.');
        } else {
          setError(verifyRes?.message || 'Payment verification failed');
        }
      } catch (paymentError) {
        toast.dismiss();
        if (paymentError.message === 'Payment cancelled by user') {
          setError('Payment cancelled');
          toast.error('Payment cancelled');
        } else {
          setError(paymentError.message || 'Payment failed');
          console.error('Payment error:', paymentError);
        }
      }
    } catch (err) {
      console.error('Razorpay process error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error processing payment. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
      toast.dismiss();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Verify all address parameters are filled
    if (!address.street || !address.city || !address.state || !address.zip || !address.country) {
      setError('Please fill in all shipping address fields');
      return;
    }

    // Route to appropriate payment method handler
    if (paymentMethod === 'razorpay') {
      processRazorpayPayment();
    } else {
      processOrderCheckout();
    }
  };

  // Fix: guard against null productId before computing subtotal.
  // item.productId is null when a product was deleted but still sits in cart.
  const subtotal = cart.items.reduce((sum, item) => {
    if (!item.productId) return sum;
    return sum + getEffectivePrice(item.productId) * item.quantity;
  }, 0);
  
  // Calculate final total with coupon discount
  const finalTotal = Math.max(subtotal - couponDiscount, 0);

  return (
    <Container className="py-4">
      <h3 className="fw-bold text-dark mb-4">Checkout Storefront</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleFormSubmit}>
        <Row>
          {/* Billing Shipping addresses forms */}
          <Col lg={7} className="mb-4">
            <Card className="card-earthy p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Shipping Details</h5>
                {savedAddresses.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary p-0 text-decoration-none"
                    onClick={() => setShowAddressModal(true)}
                  >
                    📍 Use Saved Address
                  </Button>
                )}
              </div>
              
              <Form.Group className="mb-3" controlId="shipStreet">
                <Form.Label className="small fw-semibold text-muted">Street Address *</Form.Label>
                <Form.Control
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleAddressChange}
                  className="form-control-earthy"
                  placeholder="123 Main St"
                  disabled={submitting}
                  required
                />
              </Form.Group>

              <Row className="mb-3">
                <Col sm={6}>
                  <Form.Group controlId="shipCity">
                    <Form.Label className="small fw-semibold text-muted">City *</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      className="form-control-earthy"
                      placeholder="City"
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="shipState">
                    <Form.Label className="small fw-semibold text-muted">State / Province *</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      className="form-control-earthy"
                      placeholder="State"
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-2">
                <Col sm={6}>
                  <Form.Group controlId="shipZip">
                    <Form.Label className="small fw-semibold text-muted">Postal / Zip Code *</Form.Label>
                    <Form.Control
                      type="text"
                      name="zip"
                      value={address.zip}
                      onChange={handleAddressChange}
                      className="form-control-earthy"
                      placeholder="Zip Code"
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="shipCountry">
                    <Form.Label className="small fw-semibold text-muted">Country *</Form.Label>
                    <Form.Control
                      type="text"
                      name="country"
                      value={address.country}
                      onChange={handleAddressChange}
                      className="form-control-earthy"
                      placeholder="Country"
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <Card className="card-earthy p-4">
              <h5 className="fw-bold text-dark mb-3">Payment Gateway</h5>
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  label="� Razorpay"
                  name="payMethod"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  id="payRazorpay"
                  className="fw-semibold text-dark mb-2"
                  disabled={!razorpayReady}
                />
                <Form.Check
                  type="radio"
                  label="💵 Cash On Delivery (COD)"
                  name="payMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  id="payCOD"
                  className="fw-semibold text-dark"
                />
              </Form.Group>

              {paymentMethod === 'razorpay' && (
                <div className="bg-light p-3 border rounded small text-muted">
                  🔒 Secure payment via Razorpay. Test credentials are enabled for demo mode.
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div className="bg-light p-3 border rounded small text-muted">
                  💰 Pay with cash when your order arrives at your doorstep.
                </div>
              )}
            </Card>

            {/* Address Selection Modal */}
            <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Select Saved Address</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {savedAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded mb-2 cursor-pointer hover"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => handleSelectSavedAddress(addr)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <p className="mb-1 small fw-bold">{addr.street}</p>
                    <p className="mb-0 small text-muted">
                      {addr.city}, {addr.state} - {addr.zip}, {addr.country}
                    </p>
                  </div>
                ))}
              </Modal.Body>
            </Modal>
          </Col>

          {/* Cart review card */}
          <Col lg={5}>
            <Card className="card-earthy p-4">
              <h5 className="fw-bold text-dark mb-3">Order Items</h5>
              <ListGroup variant="flush" className="mb-3">
                {cart.items.map((item) => {
                  const product = item.productId;
                  if (!product) return null;
                  
                  // Fix #2/#17: Use safe price helper
                  const price = getEffectivePrice(product);

                  return (
                    <ListGroup.Item key={item._id} className="px-0 py-2 bg-transparent d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <Image
                          src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                          rounded
                          style={{ height: '40px', width: '40px', objectFit: 'cover' }}
                        />
                        <div style={{ maxWidth: '200px' }}>
                          <h6 className="mb-0 text-truncate small">{product.name}</h6>
                          <span className="small text-muted">{item.quantity} x ₹{price}</span>
                        </div>
                      </div>
                      <span className="small fw-bold text-dark">₹{(price * item.quantity).toFixed(2)}</span>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
              
              <hr />

              <div className="d-flex justify-content-between mb-2 small text-muted">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 small text-muted">
                <span>Shipping</span>
                <span className="text-success">FREE</span>
              </div>
              
              {/* Coupon Input Section */}
              <div className="mb-3">
                {!appliedCoupon ? (
                  <Form.Group className="mb-0">
                    <div className="small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                      💡 {subtotal >= 3000 ? (
                        <>Use <strong>SHOPEZ15</strong> to get 15% off</>
                      ) : subtotal >= 500 ? (
                        <>Use <strong>SAVE10</strong> to get 10% off</>
                      ) : (
                        <>Add ₹{(500 - subtotal).toFixed(2)} more to unlock coupon</>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="form-control-earthy py-1"
                        disabled={couponLoading || submitting}
                        style={{ fontSize: '0.9rem' }}
                      />
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || submitting}
                        className="border-clay"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                  </Form.Group>
                ) : (
                  <div className="d-flex justify-content-between align-items-center bg-success bg-opacity-10 p-2 rounded border border-success">
                    <span className="small fw-bold text-success">✓ {appliedCoupon}</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0 text-decoration-none"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {couponDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 small text-success fw-bold">
                  <span>Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <hr className="my-2" />
              <div className="d-flex justify-content-between mb-4 fw-bold text-dark fs-5">
                <span>Order Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <Button
                type="submit"
                className="btn-earthy w-100 py-2 fw-semibold"
                disabled={submitting || (paymentMethod === 'razorpay' && !razorpayReady)}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    {paymentMethod === 'razorpay' ? 'Processing Payment...' : 'Authorizing Payment...'}
                  </>
                ) : paymentMethod === 'razorpay' ? (
                  `Pay with Razorpay (₹${finalTotal.toFixed(2)})`
                ) : (
                  `Place Order (₹${finalTotal.toFixed(2)})`
                )}
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default Checkout;
