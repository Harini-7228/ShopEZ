import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getReorderSuggestions, runReorderAction } from '../api/reordersApi';
import { Container, Row, Col, Card, Button, Form, Image, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const Reorders = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const loadSuggestions = async () => {
    try {
      const res = await getReorderSuggestions();
      if (res && res.success) {
        setSuggestions(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reorder suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleReorder = async (productId) => {
    try {
      const result = await addToCart(productId, 1);
      if (result?.success) {
        navigate('/cart');
      }
    } catch (err) {
      toast.error('Failed to add product to cart');
    }
  };

  const handleAction = async (reminderId, action, snoozeDays = 7) => {
    try {
      const res = await runReorderAction(reminderId, { action, snoozeDays });
      if (res && res.success) {
        toast.success(res.message || 'Action completed successfully');
        // Remove item from suggestion list locally
        setSuggestions((prev) => prev.filter((item) => item._id !== reminderId));
      }
    } catch (err) {
      toast.error('Failed to process reminder action');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-75">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-4 ">
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">🌾 Smart Reorder Suggestions</h3>
        <p className="text-muted small">Based on your past purchases of repeating groceries & household items</p>
      </div>

      {suggestions.length > 0 ? (
        <Row className="gy-4">
          {suggestions.map((item) => {
            const product = item.productId;
            if (!product) return null;

            const price = (product.discountPrice != null && product.discountPrice > 0)
              ? product.discountPrice
              : product.price;

            return (
              <Col key={item._id} xs={12} md={6}>
                <Card className="card-earthy p-3">
                  <div className="d-flex gap-3">
                    <Image
                      src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                      rounded
                      style={{ height: '90px', width: '90px', objectFit: 'cover' }}
                    />
                    
                    <div className="flex-grow-1">
                      <h6 className="fw-bold text-dark mb-1">
                        <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
                          {product.name}
                        </Link>
                      </h6>
                      
                      <div className="small text-muted mb-2">
                        Last bought:{' '}
                        <strong>
                          {new Date(item.lastOrderedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </strong>{' '}
                        &bull; Interval:{' '}
                        <strong>{item.suggestedIntervalDays} days</strong>
                      </div>

                      <div className="d-flex align-items-center justify-content-between mt-3 gap-2">
                        <Button
                          onClick={() => handleReorder(product._id)}
                          className="btn-earthy btn-sm py-1 px-3 text-white small"
                          disabled={product.stock <= 0}
                        >
                          {product.stock > 0 ? `Reorder - ₹${price}` : 'Out of Stock'}
                        </Button>
                        
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleAction(item._id, 'snooze', 7)}
                            className="py-1 px-2 small border-clay"
                          >
                            Snooze 7d
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleAction(item._id, 'dismiss')}
                            className="py-1 px-2 small border-clay"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
          <div className="fs-1 mb-3">🕒</div>
          <h5>No Suggestions Due</h5>
          <p className="small mb-0">We calculate reorder intervals when purchases are delivered. Check back later!</p>
        </div>
      )}
    </Container>
  );
};

export default Reorders;
