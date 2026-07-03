import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../api/orders';
import { Container, Row, Col, Card, Badge, Table, Image, Spinner, Button } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await getOrderById(id);
        if (res && res.success) {
          setOrder(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action will restock the items and refund your payment.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await cancelOrder(order._id);
      if (res && res.success) {
        toast.success('Order cancelled successfully');
        setOrder(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  /**
   * =========================================================================
   * ISOLATED FUNCTION: ORDER STATUS TIMELINE RENDERER
   * =========================================================================
   * Renders the order tracking status updates chronologically with notes.
   */
  const renderOrderStatusTimeline = (statusHistory = []) => {
    if (!statusHistory || statusHistory.length === 0) {
      return <p className="small text-muted mb-0">No tracking milestones log found.</p>;
    }

    return (
      <div className="position-relative ps-4 ms-2" style={{ borderLeft: '3px solid var(--border-clay)' }}>
        {statusHistory.map((history, idx) => {
          const isLast = idx === statusHistory.length - 1;
          
          return (
            <div key={history._id || idx} className="position-relative mb-4">
              {/* Timeline indicator node */}
              <span
                className={`position-absolute start-0 translate-middle rounded-circle d-flex align-items-center justify-content-center ${
                  isLast ? 'bg-success text-white' : 'bg-secondary bg-opacity-20 text-muted'
                }`}
                style={{
                  left: '-26px',
                  width: '24px',
                  height: '24px',
                  border: '3px solid #fff',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {isLast ? '✓' : '•'}
              </span>

              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Badge className={`badge-status badge-${history.status ? history.status.toLowerCase() : ''} py-1 px-2`}>
                    {history.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="small text-muted font-monospace" style={{ fontSize: '0.8rem' }}>
                    {new Date(history.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {history.note && (
                  <p className="small text-muted mt-2 mb-0 bg-light p-2 rounded-3 border border-light">
                    💬 {history.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-75">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-3 text-center text-muted">
        <h4>Order Not Found</h4>
        <Link to="/orders/history" className="btn-earthy mt-3">Back to Orders</Link>
      </Container>
    );
  }

  return (
    <Container className="py-4 ">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <Link to="/orders/history" className="text-decoration-none small text-muted">&larr; Back to History</Link>
          <h3 className="fw-extrabold text-dark mt-1 mb-0">Track Order</h3>
          <span className="small text-muted font-monospace">Order Code: {order._id}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <Button
              variant="outline-danger"
              className="fw-bold px-3 py-2 btn-sm"
              style={{ borderRadius: '6px' }}
              disabled={cancelling}
              onClick={handleCancelOrder}
            >
              {cancelling ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </Button>
          )}
          <Badge className={`badge-status badge-${order.status ? order.status.toLowerCase() : ''} fs-6 py-2 px-3`}>
            {order.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <Row>
        {/* Left column: tracking details and shipping/payment summary */}
        <Col lg={8} className="mb-4">
          <Card className="card-earthy p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Tracking History</h5>
            {renderOrderStatusTimeline(order.statusHistory)}
          </Card>

          <Card className="card-earthy p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Order Items</h5>
            <Table hover responsive className="table-earthy small mb-0 border-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const product = item.productId;
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Image
                            src={product?.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                            rounded
                            style={{ height: '45px', width: '45px', objectFit: 'cover' }}
                          />
                          <div>
                            <span className="fw-semibold text-dark d-block">
                              {product ? product.name : 'Unknown Product'}
                            </span>
                            {product?.isLocalListing && (
                              <span className="text-success small fw-bold" style={{ fontSize: '0.75rem' }}>✨ Premium Listing</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end fw-bold text-dark">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </Col>

        {/* Right column: Delivery, Shipping Address, Payment details */}
        <Col lg={4}>
          {order.status !== 'cancelled' && (
            <Card className="card-earthy p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">
                {order.status === 'delivered' ? 'Delivery Date' : 'Estimated Delivery'}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <span className="fs-3">📅</span>
                <div>
                  <h6 className="mb-0 text-dark fw-bold">
                    {order.status === 'delivered'
                      ? new Date(order.updatedAt).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : new Date(order.estimatedDeliveryDate || new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                  </h6>
                  <span className="small text-muted">
                    {order.status === 'delivered' ? 'Successfully delivered to recipient' : 'Estimated transit time'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <Card className="card-earthy p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Shipping Address</h5>
            <p className="small text-muted mb-0" style={{ lineHeight: '1.7' }}>
              <strong>Street:</strong> {order.shippingAddress?.street}<br />
              <strong>City:</strong> {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}<br />
              <strong>Country:</strong> {order.shippingAddress?.country}
            </p>
          </Card>

          <Card className="card-earthy p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Payment Summary</h5>
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Payment Type</span>
              <span className="text-uppercase fw-semibold text-dark">{order.paymentId?.method || 'Card'}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Gateway Ref</span>
              <span className="font-monospace text-truncate" style={{ maxWidth: '160px' }}>
                {order.paymentId?.gatewayRef || 'N/A'}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Payment Status</span>
              <Badge bg={order.paymentId?.status === 'success' ? 'success' : 'warning'} className="badge-status">
                {order.paymentId?.status || 'pending'}
              </Badge>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold text-dark fs-5">
              <span>Total Paid</span>
              <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </Card>

          {order.deliveryManagerId && (
            <Card className="card-earthy p-4 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Delivery Partner</h5>
              <div className="d-flex align-items-center gap-3">
                <span className="fs-1">🚚</span>
                <div>
                  <h6 className="mb-0 text-dark fw-bold">{order.deliveryManagerId.name}</h6>
                  <span className="small text-muted">{order.deliveryManagerId.email}</span>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetail;
