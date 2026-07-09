import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/ordersApi';
import { Container, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getMyOrders();
        if (res && res.success) {
          setPayments(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-75">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h3 className="fw-bold text-dark mb-4">💳 Payment History</h3>

      {payments.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="table-earthy shadow-sm">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="small font-monospace">{payment._id.slice(0, 8)}...</td>
                  <td>
                    {new Date(payment.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="fw-bold">₹{(payment.totalAmount ?? 0).toFixed(2)}</td>
                  <td>
                    {/* Payment method lives on the linked Payment document.
                        Fallback gracefully when not populated. */}
                    <span className="small">
                      {payment.paymentId?.method === 'razorpay'
                        ? '💳 Razorpay'
                        : payment.paymentId?.method === 'cod'
                        ? '💰 Cash on Delivery'
                        : '—'}
                    </span>
                  </td>
                  <td>
                    {/* Order status reflects payment outcome for display purposes */}
                    <Badge bg={
                      payment.status === 'delivered' ? 'success' :
                      payment.status === 'cancelled' ? 'danger' :
                      'warning'
                    }>
                      {payment.status?.replace(/_/g, ' ') || 'pending'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      as={Link}
                      to={`/orders/${payment._id}`}
                      className="btn-earthy btn-sm py-1"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-5 bg-white border rounded text-center text-muted shadow-sm">
          <div className="fs-1 mb-3">💳</div>
          <h5>No Payment History</h5>
          <p className="small mb-4">You haven't made any payments yet.</p>
          <Link to="/products" className="btn-earthy">Browse Products</Link>
        </div>
      )}
    </Container>
  );
};

export default PaymentHistory;
