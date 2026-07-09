import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Badge, Button, Form, Card, Row, Col, Spinner, Alert, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getAllTickets } from '../../api/supportApi';

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & search
  const [statusFilter, setStatusFilter] = useState(''); // '' means All, otherwise 'open', 'in-progress', 'resolved'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllTicketsList = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const res = await getAllTickets(params);
      if (res?.success) {
        setTickets(res.data);
      } else {
        setError(res?.message || 'Failed to retrieve support tickets.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching platform support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTicketsList();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge bg="primary">Open</Badge>;
      case 'in-progress':
        return <Badge bg="warning" text="dark">In Progress</Badge>;
      case 'resolved':
        return <Badge bg="success">Resolved</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge bg="danger">High</Badge>;
      case 'medium':
        return <Badge bg="warning" text="dark">Medium</Badge>;
      case 'low':
        return <Badge bg="info" text="dark">Low</Badge>;
      default:
        return <Badge bg="secondary">{priority}</Badge>;
    }
  };

  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;
    const term = searchTerm.toLowerCase();
    return tickets.filter(t => {
      const matchesSubject = t.subject?.toLowerCase().includes(term);
      const matchesUser    = t.user?.name?.toLowerCase().includes(term) ||
                             t.user?.email?.toLowerCase().includes(term);
      return matchesSubject || matchesUser;
    });
  }, [tickets, searchTerm]);

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Support Center Control Panel</h2>
        <p className="text-muted mb-0 small">Platform management panel to view, update statuses, and communicate with customers regarding open complaints.</p>
      </div>

      <Row className="g-3 align-items-center mb-4">
        {/* Status Filtering Tabs */}
        <Col md={8}>
          <Nav variant="pills" className="d-flex gap-2">
            {[
              { label: 'All Tickets', value: '' },
              { label: 'Open 🔵', value: 'open' },
              { label: 'In Progress 🟡', value: 'in-progress' },
              { label: 'Resolved 🟢', value: 'resolved' },
            ].map(tab => (
              <Nav.Item key={tab.label}>
                <Button
                  onClick={() => setStatusFilter(tab.value)}
                  className={`border-0 py-2 px-3 fw-bold`}
                  style={{
                    background: statusFilter === tab.value ? 'var(--primary-terracotta)' : '#ffffff',
                    color: statusFilter === tab.value ? '#ffffff' : 'var(--text-dark)',
                    border: statusFilter === tab.value ? 'none' : '1px solid rgba(226,232,240,0.8)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {tab.label}
                </Button>
              </Nav.Item>
            ))}
          </Nav>
        </Col>

        {/* Live Search Field */}
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="🔍 Search by subject or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control-earthy py-2"
            style={{ fontSize: '0.82rem' }}
          />
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted small mt-2">Loading support tickets...</p>
        </div>
      ) : filteredTickets.length > 0 ? (
        <Card className="card-earthy border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4" style={{ fontSize: '0.8rem', fontWeight: 700 }}>ID</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>CUSTOMER</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>SUBJECT</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>CATEGORY</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>PRIORITY</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>STATUS</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>LAST UPDATED</th>
                <th className="py-3 text-end px-4" style={{ fontSize: '0.8rem', fontWeight: 700 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t._id}>
                  <td className="px-4 py-3 text-muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    #{t._id.substring(t._id.length - 8).toUpperCase()}
                  </td>
                  <td className="py-3">
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>{t.user?.name}</span>
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>{t.user?.email}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="fw-semibold text-dark text-truncate d-inline-block" style={{ fontSize: '0.84rem', maxWidth: '240px' }}>
                      {t.subject}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-secondary small fw-semibold">{t.category}</span>
                  </td>
                  <td className="py-3">{getPriorityBadge(t.priority)}</td>
                  <td className="py-3">{getStatusBadge(t.status)}</td>
                  <td className="py-3 text-muted small">
                    {new Date(t.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button 
                      as={Link} 
                      to={`/support/${t._id}`} 
                      className="btn-earthy btn-sm py-1 px-3"
                      style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                    >
                      Answer / Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Card className="text-center p-5 card-earthy border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="fs-1 mb-3">📭</div>
          <h5 className="fw-bold text-dark">No Support Tickets Found</h5>
          <p className="text-muted small mb-0">No customer support tickets match the current selection.</p>
        </Card>
      )}
    </Container>
  );
};

export default AdminSupportTickets;
