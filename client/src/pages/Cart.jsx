import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toggleWishlistItem } from '../api/wishlist';
import { Container, Row, Col, Card, Button, Form, Image, ListGroup } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

// Helper: safe price — discountPrice=0 must NOT fall back to full price (Fix #2/#13)
const getEffectivePrice = (product) => {
  return (product.discountPrice != null && product.discountPrice > 0)
    ? product.discountPrice
    : product.price;
};

const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = async (productId, newQty, stock) => {
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.error(`Only ${stock} items available in stock`);
      return;
    }
    await updateQuantity(productId, newQty);
  };

  // Fix #5: Allow typing quantity directly in the input field
  const handleQuantityInput = async (productId, rawValue, stock) => {
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed < 1) return;
    if (parsed > stock) {
      toast.error(`Only ${stock} items available in stock`);
      return;
    }
    await updateQuantity(productId, parsed);
  };

  const handleMoveToWishlist = async (productId) => {
    try {
      // 1. Add to wishlist
      await toggleWishlistItem(productId);
      // 2. Remove from cart
      await removeFromCart(productId);
      toast.success('Moved item to wishlist');
    } catch (err) {
      toast.error('Failed to move item to wishlist');
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Container className="py-3 text-center text-muted d-flex flex-column align-items-center justify-content-center">
        <div className="fs-1 mb-3">🛒</div>
        <h4>Your Cart is Empty</h4>
        <p className="small mb-4">Add products to your cart to begin checking out.</p>
        <Link to="/products" className="btn-earthy">Browse Products</Link>
      </Container>
    );
  }

  // Fix #2/#13: Use safe price helper
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + getEffectivePrice(item.productId) * item.quantity;
  }, 0);

  return (
    <Container className="py-4">
      <h3 className="fw-bold text-dark mb-4">Shopping Cart</h3>
      <Row>
        {/* Cart items list */}
        <Col lg={8} className="mb-4">
          <ListGroup className="shadow-sm border rounded overflow-hidden">
            {cart.items.map((item) => {
              const product = item.productId;
              if (!product) return null;

              const currentPrice = getEffectivePrice(product);

              return (
                <ListGroup.Item key={item._id} className="p-3">
                  <Row className="align-items-center">
                    <Col xs={3} sm={2}>
                      <Image
                        src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                        rounded
                        fluid
                        style={{ height: '70px', width: '70px', objectFit: 'cover' }}
                      />
                    </Col>
                    
                    <Col xs={9} sm={5} className="mb-2 mb-sm-0">
                      <h6 className="fw-bold text-dark mb-1 text-truncate">
                        <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
                          {product.name}
                        </Link>
                      </h6>
                      <span className="small text-muted d-block mb-1">
                        Price: ₹{currentPrice}
                      </span>
                      <Button variant="link" size="sm" className="text-muted p-0 me-3 text-decoration-none small" onClick={() => handleMoveToWishlist(product._id)}>
                        Move to Wishlist
                      </Button>
                      <Button variant="link" size="sm" className="text-danger p-0 text-decoration-none small" onClick={() => removeFromCart(product._id)}>
                        Remove
                      </Button>
                    </Col>
                    
                    {/* Fix #5: Quantity input is now editable */}
                    <Col xs={6} sm={3} className="d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleQuantityChange(product._id, item.quantity - 1, product.stock)}
                        className="py-0 px-2"
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        value={item.quantity}
                        min={1}
                        max={product.stock}
                        onChange={(e) => handleQuantityInput(product._id, e.target.value, product.stock)}
                        className="form-control-earthy text-center mx-2 py-0"
                        style={{ width: '55px', height: '28px', fontSize: '0.9rem' }}
                      />
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleQuantityChange(product._id, item.quantity + 1, product.stock)}
                        className="py-0 px-2"
                      >
                        +
                      </Button>
                    </Col>
                    
                    <Col xs={6} sm={2} className="text-end fw-bold text-dark">
                      ₹{(currentPrice * item.quantity).toFixed(2)}
                    </Col>
                  </Row>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>

        {/* Order Summary Checkout Card */}
        <Col lg={4}>
          <Card className="card-earthy p-4">
            <Card.Title className="fw-bold text-dark mb-3">Order Summary</Card.Title>
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Items Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 small text-muted">
              <span>Shipping</span>
              <span className="text-success">FREE</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-4 fw-bold text-dark fs-5">
              <span>Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => navigate('/checkout')}
              className="btn-earthy w-100 py-2 fw-semibold"
            >
              Proceed to Checkout
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
