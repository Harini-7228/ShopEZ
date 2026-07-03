import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSellerDashboard } from '../../api/seller';
import { deleteProduct, updateProductStock } from '../../api/products';
import { updateOrderStatus } from '../../api/orders';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const SellerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockInputs, setStockInputs] = useState({});

  const loadDashboard = async () => {
    try {
      const res = await getSellerDashboard();
      if (res && res.success) {
        setDashboardData(res.data);
        
        // Initialize stock change values
        const stockMap = {};
        res.data.products.forEach((p) => {
          stockMap[p._id] = p.stock;
        });
        setStockInputs(stockMap);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load seller dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const res = await deleteProduct(id);
        if (res && res.success) {
          toast.success('Product listing deleted');
          await loadDashboard();
        }
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleStockUpdate = async (id) => {
    const stockVal = stockInputs[id];
    if (stockVal === undefined || stockVal < 0) {
      toast.error('Invalid stock value');
      return;
    }
    try {
      const res = await updateProductStock(id, parseInt(stockVal, 10));
      if (res && res.success) {
        toast.success('Stock updated successfully');
        await loadDashboard();
      }
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  const handleStockInputChange = (id, val) => {
    setStockInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleMarkAsShipped = async (orderId) => {
    try {
      const res = await updateOrderStatus(orderId, { status: 'shipped', note: 'Seller completed packaging and shipped the parcel.' });
      if (res && res.success) {
        toast.success('Order successfully marked as shipped!');
        await loadDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-50">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  const { trustScore, trustBreakdown, products, orders } = dashboardData;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-0">Seller Dashboard</h3>
          <p className="text-muted small mb-0">Manage products, verify transactions, and monitor merchant performance scores.</p>
        </div>
        <Button as={Link} to="/seller/products/new" className="btn-earthy">
          + Add New Product
        </Button>
      </div>

      {/* Merchant Trust Spotlight */}
      <Card className="spotlight-box border rounded mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <h5 className="fw-bold text-success mb-1">🛡️ Merchant Trust Score</h5>
            <p className="small text-muted mb-3">ShopEZ measures your seller rating based on total orders fulfilled, customer reviews, and repeat buyer rate.</p>
            <Row className="small">
              <Col xs={6} sm={4} className="mb-2">
                <span className="text-muted d-block">Orders fulfilled</span>
                <strong>{trustBreakdown?.ordersFulfilled} orders</strong>
              </Col>
              <Col xs={6} sm={4} className="mb-2">
                <span className="text-muted d-block">Average rating</span>
                <strong>⭐ {trustBreakdown?.avgRating} / 5.0</strong>
              </Col>
              <Col xs={6} sm={4} className="mb-2">
                <span className="text-muted d-block">Repeat customer rate</span>
                <strong>{trustBreakdown?.repeatCustomerRate}%</strong>
              </Col>
            </Row>
          </Col>
          <Col md={4} className="text-center">
            <div className="d-inline-block p-4 rounded-circle bg-success bg-opacity-10 text-success border border-success fw-bold fs-3">
              {trustScore} / 100
            </div>
            <div className="small fw-semibold text-success mt-2">Trust Tier</div>
          </Col>
        </Row>
      </Card>

      {/* Storefront Products */}
      <h5 className="fw-bold text-dark mb-3 mt-4">My Storefront Listings ({products.length})</h5>
      {products.length > 0 ? (
        <div className="table-responsive mb-5">
          <Table hover className="table-earthy align-middle">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Featured Listing</th>
                <th>Quick Stock Management</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="small font-monospace">{p.sku}</td>
                  <td className="fw-semibold text-dark">{p.name}</td>
                  <td>
                    ₹{p.discountPrice || p.price}
                    {p.discountPrice && (
                      <span className="text-decoration-line-through text-muted small ms-2">₹{p.price}</span>
                    )}
                  </td>
                  <td>{p.category?.name || 'N/A'}</td>
                  <td>
                    <Badge bg={p.isLocalListing ? 'success' : 'secondary'} className="badge-status">
                      {p.isLocalListing ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td style={{ maxWidth: '170px' }}>
                    <InputGroup size="sm">
                      <Form.Control
                        type="number"
                        min={0}
                        value={stockInputs[p._id] !== undefined ? stockInputs[p._id] : ''}
                        onChange={(e) => handleStockInputChange(p._id, e.target.value)}
                        className="form-control-earthy py-0 px-2"
                      />
                      <Button variant="outline-success" onClick={() => handleStockUpdate(p._id)}>
                        Save
                      </Button>
                    </InputGroup>
                  </td>
                  <td className="text-end">
                    <Button as={Link} to={`/seller/products/${p._id}/edit`} variant="outline-secondary" size="sm" className="me-2 py-0 border-clay">
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" className="py-0 border-clay" onClick={() => handleDeleteProduct(p._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-4 bg-light text-center border rounded text-muted mb-5">
          No storefront items created yet. Add products to start selling!
        </div>
      )}

      {/* Orders Fulfilled */}
      <h5 className="fw-bold text-dark mb-3">Customer Orders to Fulfill ({orders.length})</h5>
      {orders.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="table-earthy align-middle">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Status</th>
                <th>Recipient</th>
                <th>Destination</th>
                <th>Order Date</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="small font-monospace">{o._id}</td>
                  <td>
                    <Badge className={`badge-status badge-${o.status ? o.status.toLowerCase() : ''}`}>
                      {o.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td>{o.userId?.name}</td>
                  <td className="small text-muted">{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    {o.status === 'confirmed' && (
                      <Button onClick={() => handleMarkAsShipped(o._id)} className="btn-earthy btn-sm py-1">
                        Mark as Shipped
                      </Button>
                    )}
                    <Button as={Link} to={`/orders/${o._id}`} variant="outline-secondary" size="sm" className="ms-2 py-1 border-clay">
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="p-4 bg-light text-center border rounded text-muted">
          No orders associated with your listings yet.
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
