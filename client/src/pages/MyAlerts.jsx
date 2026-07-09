import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listAlerts, unsubscribeAlert } from '../api/alertsApi';
import { Container, Row, Col, Card, Button, Badge, Image, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const MyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await listAlerts();
      if (res && res.success) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load alert subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleUnsubscribe = async (alertId) => {
    try {
      const res = await unsubscribeAlert(alertId);
      if (res && res.success) {
        toast.success('Unsubscribed from alert successfully');
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      }
    } catch (err) {
      toast.error('Failed to unsubscribe');
    }
  };

  // Sort alerts newest first — `triggered` field doesn't exist on PriceAlert model,
  // so the previous sort by it was a no-op. Sort by createdAt descending instead.
  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-75">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-4 ">
      <h3 className="fw-bold text-dark mb-4">My Alert Subscriptions</h3>

      {alerts.length > 0 ? (
        <Row className="gy-4">
          {sortedAlerts.map((alert) => {
            const product = alert.productId;
            if (!product) return null;

            // Fix #13: discountPrice=0 must not fall back to full price
            const currentPrice = (product.discountPrice != null && product.discountPrice > 0)
              ? product.discountPrice
              : product.price;

            return (
              <Col key={alert._id} xs={12} md={6}>
                <Card className="card-earthy p-3">
                  <div className="d-flex gap-3">
                    <Image
                      src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                      rounded
                      style={{ height: '80px', width: '80px', objectFit: 'cover' }}
                    />
                    
                    <div className="flex-grow-1">
                      <h6 className="fw-bold text-dark mb-1">
                        <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
                          {product.name}
                        </Link>
                      </h6>
                      
                      <div className="mb-2">
                        <Badge bg={alert.type === 'price_drop' ? 'danger' : 'info'} className="badge-status me-2">
                          {alert.type === 'price_drop' ? 'Price Drop' : 'Back in stock'}
                        </Badge>
                        <span className="small text-muted font-monospace">
                          Current: ₹{currentPrice}
                        </span>
                      </div>

                      {alert.type === 'price_drop' && (
                        <p className="small text-muted mb-2">
                          Alert Threshold target: <strong className="text-danger">₹{alert.targetPrice}</strong>
                        </p>
                      )}
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleUnsubscribe(alert._id)}
                        className="py-0 px-2 small border-clay"
                      >
                        Cancel Alert
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
          <div className="fs-1 mb-3">🔔</div>
          <h5>No Active Alerts</h5>
          <p className="small mb-4">Set alerts on product detail pages to get notified when prices drop or items restock.</p>
          <Link to="/products" className="btn-earthy">Browse Marketplace</Link>
        </div>
      )}
    </Container>
  );
};

export default MyAlerts;
