import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, updateOrderStatus } from '../../api/ordersApi';
import { Container, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadShipments = async () => {
    try {
      const res = await getMyOrders();
      if (res && res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve delivery shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleUpdateStatus = async (orderId, nextStatus, logNote) => {
    // Confirm before marking delivered — action is irreversible
    if (nextStatus === 'delivered') {
      if (!window.confirm('Confirm this order has been delivered? This cannot be undone.')) return;
    }
    try {
      const res = await updateOrderStatus(orderId, {
        status: nextStatus,
        note: logNote,
      });

      if (res && res.success) {
        toast.success(`Package updated to: ${nextStatus.replace(/_/g, ' ')}`);
        await loadShipments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status transition failed');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-50">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  // Segment shipments — server now returns only:
  //   - unassigned shipped orders (claimable)
  //   - orders assigned to this delivery agent
  const availableShipments  = orders.filter((o) => o.status === 'shipped' && !o.deliveryManagerId);
  const activeDeliveries    = orders.filter((o) => o.status === 'out_for_delivery');
  const completedDeliveries = orders.filter((o) => o.status === 'delivered');

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-0">Delivery Shipments Board</h3>
        <p className="text-muted small">Pick up shipped parcels, navigate routes, and confirm customer delivery.</p>
      </div>

      {/* Active deliveries (In Transit) */}
      <h5 className="fw-bold text-dark mb-3 mt-4">🚚 In Transit / My Active Runs ({activeDeliveries.length})</h5>
      {activeDeliveries.length > 0 ? (
        <div className="table-responsive mb-4">
          <Table hover className="table-earthy align-middle">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Recipient Name</th>
                <th>Destination</th>
                <th>Total Price</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeDeliveries.map((o) => (
                <tr key={o._id}>
                  <td className="small font-monospace">{o._id}</td>
                  <td className="fw-semibold text-dark">{o.userId?.name}</td>
                  <td className="small text-muted">{o.shippingAddress?.street}, {o.shippingAddress?.city}</td>
                  <td>₹{(o.totalAmount ?? 0).toFixed(2)}</td>
                  <td className="text-end">
                    <Button
                      onClick={() => handleUpdateStatus(o._id, 'delivered', 'Driver delivered parcel to recipient shipping address.')}
                      className="btn-green btn-sm py-1 me-2"
                    >
                      Confirm Delivered
                    </Button>
                    <Button as={Link} to={`/orders/${o._id}`} variant="outline-secondary" size="sm" className="py-1 border-clay">
                      Route Info
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-3 bg-light text-center border rounded text-muted mb-4 small">
          No runs currently in transit. Claim a shipment from the board below to start.
        </div>
      )}

      {/* Available shipments to claim */}
      <h5 className="fw-bold text-dark mb-3 mt-4">📦 Shipped Board (Ready for pickup) ({availableShipments.length})</h5>
      {availableShipments.length > 0 ? (
        <div className="table-responsive mb-4">
          <Table hover className="table-earthy align-middle">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Recipient Name</th>
                <th>Destination City</th>
                <th>Fulfillment Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {availableShipments.map((o) => (
                <tr key={o._id}>
                  <td className="small font-monospace">{o._id}</td>
                  <td className="fw-semibold text-dark">{o.userId?.name}</td>
                  <td className="small text-muted">{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    <Button
                      onClick={() => handleUpdateStatus(o._id, 'out_for_delivery', 'Driver checked out parcel for delivery transit.')}
                      className="btn-earthy btn-sm py-1 me-2"
                    >
                      Start Delivery
                    </Button>
                    <Button as={Link} to={`/orders/${o._id}`} variant="outline-secondary" size="sm" className="py-1 border-clay">
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-3 bg-light text-center border rounded text-muted mb-4 small">
          No shipped parcels awaiting pickup on the board.
        </div>
      )}

      {/* Completed deliveries history */}
      <h5 className="fw-bold text-dark mb-3 mt-4">✅ Completed Deliveries ({completedDeliveries.length})</h5>
      {completedDeliveries.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="table-earthy align-middle">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Recipient Name</th>
                <th>Destination</th>
                <th>Delivered Date</th>
                <th className="text-end">Details</th>
              </tr>
            </thead>
            <tbody>
              {completedDeliveries.map((o) => (
                <tr key={o._id}>
                  <td className="small font-monospace">{o._id}</td>
                  <td>{o.userId?.name}</td>
                  <td className="small text-muted">{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                  <td>{new Date(o.updatedAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    <Button as={Link} to={`/orders/${o._id}`} variant="outline-secondary" size="sm" className="py-1 border-clay">
                      View log
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-3 bg-light text-center border rounded text-muted small">
          You haven't completed any deliveries yet.
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
