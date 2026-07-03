import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSalesSummary, getTopSellers, getLowStockReport } from '../../api/admin';
import { Container, Row, Col, Card, Table, Badge, Button, ProgressBar, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [salesSummary, setSalesSummary] = useState(null);
  const [topSellers, setTopSellers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminMetrics = async () => {
      try {
        const salesRes = await getSalesSummary();
        if (salesRes && salesRes.success) setSalesSummary(salesRes.data);

        const sellersRes = await getTopSellers();
        if (sellersRes && sellersRes.success) setTopSellers(sellersRes.data);

        const stockRes = await getLowStockReport();
        if (stockRes && stockRes.success) setLowStock(stockRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to retrieve administrator metrics');
      } finally {
        setLoading(false);
      }
    };
    loadAdminMetrics();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-50">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  const { totalRevenue, transactionCount, orders } = salesSummary;

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-0">Platform Overview Dashboard</h3>
        <p className="text-muted small">Analyze system metrics, top small merchants, and critical inventory warnings.</p>
      </div>

      {/* Numerical summaries */}
      <Row className="gy-4 mb-4">
        <Col xs={12} sm={6} md={3}>
          <Card className="card-earthy p-3">
            <span className="small text-muted d-block uppercase fw-bold mb-1">TOTAL REVENUE</span>
            <h4 className="fw-bold text-dark mb-0">₹{totalRevenue.toFixed(2)}</h4>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="card-earthy p-3">
            <span className="small text-muted d-block uppercase fw-bold mb-1">TRANSACTIONS COUNT</span>
            <h4 className="fw-bold text-dark mb-0">{transactionCount} processed</h4>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="card-earthy p-3">
            <span className="small text-muted d-block uppercase fw-bold mb-1">TOTAL ORDERS COUNT</span>
            <h4 className="fw-bold text-dark mb-0">{orders.total} placements</h4>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="card-earthy p-3">
            <span className="small text-muted d-block uppercase fw-bold mb-1">DELIVERED STATUS</span>
            <h4 className="fw-bold text-success mb-0">{orders.delivered} completed</h4>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top selling merchants */}
        <Col lg={6} className="mb-4">
          <Card className="card-earthy p-4 h-100">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">🏆 Top Performing Sellers</h5>
            {topSellers.length > 0 ? (
              <Table hover size="sm" className="table-earthy small align-middle mb-0">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Delivered Sales</th>
                    <th>Volume</th>
                    <th className="text-end">Impact Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellers.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-dark">
                        {item.seller?.name}{' '}
                        {item.seller?.isLocalSeller && <Badge bg="primary" className="ms-1" style={{ fontSize: '0.6rem' }}>Verified</Badge>}
                      </td>
                      <td>₹{item.totalRevenue.toFixed(2)}</td>
                      <td>{item.totalItemsSold} items</td>
                      <td className="text-end fw-bold text-success">{item.seller?.sellerImpactScore}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="p-3 bg-light text-center text-muted border rounded small">
                No seller statistics available yet.
              </div>
            )}
          </Card>
        </Col>

        {/* Low stock alerts report */}
        <Col lg={6} className="mb-4">
          <Card className="card-earthy p-4 h-100">
            <h5 className="fw-bold text-danger border-bottom pb-2 mb-3">⚠️ Critical Low-Stock Warnings</h5>
            {lowStock.length > 0 ? (
              <Table hover size="sm" className="table-earthy small align-middle mb-0">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Stock</th>
                    <th className="text-end">Supplier / Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((prod) => (
                    <tr key={prod._id}>
                      <td className="small font-monospace">{prod.sku}</td>
                      <td className="fw-semibold text-dark">
                        <Link to={`/products/${prod._id}`} className="text-decoration-none text-dark">
                          {prod.name}
                        </Link>
                      </td>
                      <td>
                        <Badge bg={prod.stock === 0 ? 'danger' : 'warning'} className="badge-status">
                          {prod.stock === 0 ? 'OUT OF STOCK' : `${prod.stock} left`}
                        </Badge>
                      </td>
                      <td className="text-end small text-muted">{prod.sellerId?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="p-3 bg-light text-center text-success border rounded small d-flex flex-column align-items-center justify-content-center h-75">
                <span className="fs-3 mb-2">✅</span>
                <span>All product stock levels are healthy!</span>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
