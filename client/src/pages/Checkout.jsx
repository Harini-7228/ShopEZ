import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { checkout } from '../api/orders';
import { Container, Row, Col, Card, Form, Button, Image, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

// Helper: safe price — discountPrice=0 must NOT fall back to full price (Fix #2/#17)
const getEffectivePrice = (product) => {
  return (product.discountPrice != null && product.discountPrice > 0)
    ? product.discountPrice
    : product.price;
};

// Fix #1/#8: renderConfirmationView defined BEFORE the component body early-return guards
// to avoid any reference/render-cycle issues.
const OrderConfirmationView = ({ order }) => (
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
      Total Amount paid: <strong>₹{order?.totalAmount?.toFixed(2)}</strong>
    </p>
    <div className="d-flex gap-3">
      <Link to="/products" className="btn-earthy-outline">Continue Shopping</Link>
      <Link to="/orders/history" className="btn-earthy">Track Order History</Link>
    </div>
  </Container>
);

const Checkout = () => {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
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

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  // Fix #1: Check orderConfirmed FIRST before the cart check, to avoid
  // the empty-cart guard blocking the confirmation screen after clearCart().
  if (orderConfirmed) {
    return <OrderConfirmationView order={placedOrderDetails} />;
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

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Verify all address parameters are filled
    if (!address.street || !address.city || !address.state || !address.zip || !address.country) {
      setError('Please fill in all shipping address fields');
      return;
    }

    processOrderCheckout();
  };

  // Fix #2/#17: Use safe price helper for subtotal
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + getEffectivePrice(item.productId) * item.quantity;
  }, 0);

  return (
    <Container className="py-4">
      <h3 className="fw-bold text-dark mb-4">Checkout Storefront</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleFormSubmit}>
        <Row>
          {/* Billing Shipping addresses forms */}
          <Col lg={7} className="mb-4">
            <Card className="card-earthy p-4 mb-4">
              <h5 className="fw-bold text-dark mb-3">Shipping Details</h5>
              
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
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <Card className="card-earthy p-4">
              <h5 className="fw-bold text-dark mb-3">Simulated Payment Gateway</h5>
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  label="💳 Credit / Debit Card (Mock Authorization)"
                  name="payMethod"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  id="payCard"
                  className="fw-semibold text-dark mb-2"
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

              {paymentMethod === 'card' && (
                <div className="bg-light p-3 border rounded small text-muted">
                  🔒 Payments are simulated in checkout. Your card credentials will not be charged.
                </div>
              )}
            </Card>
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
              <div className="d-flex justify-content-between mb-4 fw-bold text-dark fs-5">
                <span>Order Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <Button
                type="submit"
                className="btn-earthy w-100 py-2 fw-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Authorizing Payment...
                  </>
                ) : (
                  `Place Order (₹${subtotal.toFixed(2)})`
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
