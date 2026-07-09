import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/ordersApi';
import { Container, Table, Badge, Button, Spinner, Form } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        if (res && res.success) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load orders history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status) => {
    return `badge-status badge-${status ? status.toLowerCase() : ''}`;
  };

  // Memoised so filtering only reruns when orders/search/status actually change,
  // not on every unrelated re-render.
  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        order._id.includes(term) ||
        (order.shippingAddress?.city || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const uniqueStatuses = useMemo(
    () => ['all', ...new Set(orders.map((o) => o.status))],
    [orders]
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
      <h3 className="fw-bold text-dark mb-4">My Orders History</h3>

      {orders.length > 0 ? (
        <>
          {/* Search and Filter Bar */}
          <div className="d-flex gap-3 mb-4 flex-wrap">
            <Form.Group style={{ flexGrow: 1, minWidth: '250px' }}>
              <Form.Control
                type="text"
                placeholder="🔍 Search by Order ID or City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control-earthy"
              />
            </Form.Group>
            
            <Form.Group style={{ minWidth: '200px' }}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control-earthy"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.replace(/_/g, ' ')}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Results count */}
          <p className="small text-muted mb-3">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>

          {/* Table */}
          {filteredOrders.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="table-earthy shadow-sm">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items Count</th>
                    <th>Total Price</th>
                    <th>Est. Delivery</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
                    return (
                      <tr key={order._id}>
                        <td
                          className="small font-monospace text-truncate"
                          style={{ maxWidth: '140px', cursor: 'pointer' }}
                          title={`${order._id} — click to copy`}
                          onClick={() => {
                            navigator.clipboard.writeText(order._id);
                            toast.success('Order ID copied!', { duration: 1500 });
                          }}
                        >
                          {order._id}
                        </td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td>{totalItems}</td>
                        <td className="fw-bold">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="small">
                          {order.status === 'cancelled'
                            ? 'Cancelled'
                            : new Date(order.estimatedDeliveryDate || new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                        </td>
                        <td>
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            as={Link}
                            to={`/orders/${order._id}`}
                            className="btn-earthy btn-sm py-1"
                          >
                            Track Order
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
              <div className="fs-1 mb-3">🔍</div>
              <h5>No Orders Found</h5>
              <p className="small mb-0">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </>
      ) : (
        <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
          <div className="fs-1 mb-3">📋</div>
          <h5>No Orders Placed Yet</h5>
          <p className="small mb-4">You have not placed any orders yet. Browse our premium items to begin.</p>
          <Link to="/products" className="btn-earthy">Browse Catalog</Link>
        </div>
      )}
    </Container>
  );
};

export default OrderHistory;
