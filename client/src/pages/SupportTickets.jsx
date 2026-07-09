import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Table, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getMyTickets, createTicket } from '../api/supportApi';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Order Inquiry');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyTickets();
      if (res?.success) {
        setTickets(res.data);
      } else {
        setError(res?.message || 'Failed to fetch support tickets.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenModal = () => {
    setSubject('');
    setCategory('Order Inquiry');
    setPriority('medium');
    setMessage('');
    setSubmitError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');

    if (!subject.trim() || !message.trim()) {
      setSubmitError('Subject and message content are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTicket({
        subject,
        category,
        priority,
        message,
      });

      if (res?.success) {
        setSuccessMsg('Support ticket raised successfully!');
        // Refresh ticket list
        fetchTickets();
        // Close modal after 1.5s
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      } else {
        setSubmitError(res?.message || 'Failed to create support ticket.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('An error occurred while creating the support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Support Tickets</h2>
          <p className="text-muted mb-0 small">Raise inquiries, track refund cases, and speak directly to our customer support desk.</p>
        </div>
        <Button 
          className="btn-earthy px-4" 
          onClick={handleOpenModal}
          style={{ borderRadius: '6px' }}
        >
          ➕ Raise Support Ticket
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted small mt-2">Loading tickets...</p>
        </div>
      ) : tickets.length > 0 ? (
        <Card className="card-earthy border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4" style={{ fontSize: '0.8rem', fontWeight: 700 }}>TICKET ID</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>SUBJECT</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>CATEGORY</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>PRIORITY</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>STATUS</th>
                <th className="py-3" style={{ fontSize: '0.8rem', fontWeight: 700 }}>LAST UPDATED</th>
                <th className="py-3 text-end px-4" style={{ fontSize: '0.8rem', fontWeight: 700 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td className="px-4 py-3 text-muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    #{t._id.substring(t._id.length - 8).toUpperCase()}
                  </td>
                  <td className="py-3">
                    <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{t.subject}</span>
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
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Card className="text-center p-5 card-earthy border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="fs-1 mb-3">💬</div>
          <h5 className="fw-bold text-dark">No Tickets Found</h5>
          <p className="text-muted small mb-4">You have not registered any support tickets. If you need help with an order, a refund, or technical errors, we are happy to help.</p>
          <div>
            <Button 
              className="btn-earthy px-4" 
              onClick={handleOpenModal}
              style={{ borderRadius: '6px' }}
            >
              Raise Your First Ticket
            </Button>
          </div>
        </Card>
      )}

      {/* Modal Dialog */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            ✉️ New Support Ticket
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTicket}>
          <Modal.Body>
            {submitError && <Alert variant="danger" className="py-2 small">{submitError}</Alert>}
            {successMsg && <Alert variant="success" className="py-2 small">{successMsg}</Alert>}

            <Form.Group className="mb-3" controlId="ticketSubject">
              <Form.Label className="small fw-semibold text-muted">Subject / Issue Summary</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Double payment deduction on Order #310"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="form-control-earthy"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="ticketCategory">
                  <Form.Label className="small fw-semibold text-muted">Category</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-control-earthy py-2"
                  >
                    <option value="Order Inquiry">Order Inquiry</option>
                    <option value="Refund Request">Refund Request</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Product Feedback">Product Feedback</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="ticketPriority">
                  <Form.Label className="small fw-semibold text-muted">Priority Level</Form.Label>
                  <Form.Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-control-earthy py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="ticketMessage">
              <Form.Label className="small fw-semibold text-muted">Message Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Provide a detailed description of the issue. Include order IDs or payment transaction numbers if applicable."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="form-control-earthy"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="light" 
              onClick={() => setShowModal(false)}
              style={{ borderRadius: '6px' }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-earthy px-4" 
              style={{ borderRadius: '6px' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SupportTickets;
