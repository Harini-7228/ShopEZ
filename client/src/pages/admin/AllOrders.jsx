import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders } from '../../api/adminApi';
import { Container, Table, Form, Badge, Button, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await getAdminOrders(params);
      if (res && res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load platform orders list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  if (loading && orders.length === 0) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-50">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-0">Platform Orders</h3>
          <p className="text-muted small mb-0">View and track all order logs, payment details, and shipping timelines.</p>
        </div>
        
        {/* Status Filter */}
        <Form.Group className="d-flex align-items-center" style={{ minWidth: '220px' }}>
          <Form.Label className="small fw-semibold text-muted me-2 mb-0 text-nowrap">Filter Status</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control-earthy py-1"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        </Form.Group>
      </div>

      {loading ? (
        <div className="text-center py-3">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : orders.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="table-earthy align-middle small">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Total Price</th>
                <th>Fulfillment Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="small font-monospace">{o._id}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="fw-semibold text-dark">{o.userId?.name}</td>
                  <td className="small text-muted">{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                  <td className="fw-bold">₹{(o.totalAmount ?? 0).toFixed(2)}</td>
                  <td>
                    <Badge className={`badge-status badge-${o.status?.toLowerCase() ?? ''}`}>
                      {o.status?.replace(/_/g, ' ') ?? 'unknown'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      as={Link}
                      to={`/orders/${o._id}`}
                      className="btn-earthy btn-sm py-1"
                    >
                      Track Order
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
          <div className="fs-1 mb-3">📋</div>
          <h5>No Platform Orders Found</h5>
          <p className="small mb-0">No order placements match the active filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
