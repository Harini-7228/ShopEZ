import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTicketById, replyToTicket, updateTicketStatus } from '../api/supportApi';
import { toast } from 'react-hot-toast';

const SupportTicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Admin status update state
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await getTicketById(id);
      if (res?.success) {
        setTicket(res.data);
      } else {
        setError(res?.message || 'Failed to retrieve support ticket details.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching support ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    setReplyError('');

    if (!replyMessage.trim()) {
      return;
    }

    setReplying(true);
    try {
      const res = await replyToTicket(id, replyMessage.trim());
      if (res?.success) {
        setTicket(res.data);
        setReplyMessage('');
      } else {
        setReplyError(res?.message || 'Failed to send reply.');
      }
    } catch (err) {
      console.error(err);
      setReplyError('An error occurred while sending the reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await updateTicketStatus(id, newStatus);
      if (res?.success) {
        setTicket(res.data);
        toast.success(`Ticket status updated to: ${newStatus}`);
      } else {
        toast.error(res?.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while updating the status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge bg="primary" className="px-3 py-2">Open</Badge>;
      case 'in-progress':
        return <Badge bg="warning" text="dark" className="px-3 py-2">In Progress</Badge>;
      case 'resolved':
        return <Badge bg="success" className="px-3 py-2">Resolved</Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge bg="danger" className="px-2 py-1">High Priority</Badge>;
      case 'medium':
        return <Badge bg="warning" text="dark" className="px-2 py-1">Medium Priority</Badge>;
      case 'low':
        return <Badge bg="info" text="dark" className="px-2 py-1">Low Priority</Badge>;
      default:
        return <Badge bg="secondary" className="px-2 py-1">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted small mt-2">Loading ticket conversation...</p>
      </Container>
    );
  }

  if (error || !ticket) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p className="mb-0">{error || 'Support ticket details could not be loaded.'}</p>
        </Alert>
        <Button as={Link} to={user?.role === 'admin' ? '/admin/support' : '/support'} className="btn-earthy" style={{ borderRadius: '6px' }}>
          Back to Tickets List
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Link 
          to={user.role === 'admin' ? '/admin/support' : '/support'} 
          className="text-decoration-none text-muted small fw-bold"
        >
          ⬅️ Back to Support Tickets List
        </Link>
      </div>

      <Row className="g-4">
        {/* Left Column: Messages Stream */}
        <Col lg={8}>
          <Card className="card-earthy border-0 shadow-sm mb-4" style={{ borderRadius: '12px', minHeight: '400px' }}>
            <Card.Header className="bg-white border-bottom py-3">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <span className="text-muted small font-monospace">Ticket #{ticket._id.substring(ticket._id.length - 8).toUpperCase()}</span>
                  <h4 className="fw-bold text-dark mt-1 mb-0" style={{ fontFamily: 'var(--font-display)' }}>{ticket.subject}</h4>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
            </Card.Header>

            <Card.Body className="d-flex flex-column gap-3 p-4" style={{ maxHeight: '500px', overflowY: 'auto', background: '#f8fafc' }}>
              {ticket.messages.map((msg, index) => {
                const isMyMessage = msg.sender._id.toString() === user._id.toString();
                const senderRole = msg.sender.role;

                return (
                  <div 
                    key={msg._id || index}
                    className={`d-flex flex-column ${isMyMessage ? 'align-items-end' : 'align-items-start'}`}
                  >
                    <div 
                      className={`p-3 rounded shadow-sm`}
                      style={{
                        maxWidth: '75%',
                        borderRadius: '12px',
                        background: isMyMessage 
                          ? '#dbeafe' // Soft primary blue for current user
                          : '#ffffff', // White for others
                        color: 'var(--text-dark)',
                        border: isMyMessage ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1 gap-4">
                        <span className="fw-bold small" style={{ fontSize: '0.78rem' }}>
                          {isMyMessage ? 'You' : msg.sender.name}
                          {!isMyMessage && senderRole === 'admin' && (
                            <Badge bg="dark" className="ms-1 px-2 py-1" style={{ fontSize: '0.62rem', fontWeight: 600 }}>Support Staff</Badge>
                          )}
                          {!isMyMessage && senderRole === 'customer' && (
                            <Badge bg="secondary" className="ms-1 px-2 py-1" style={{ fontSize: '0.62rem', fontWeight: 600 }}>Customer</Badge>
                          )}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mb-0 text-break" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card.Body>

            {/* Reply Input Box */}
            <Card.Footer className="bg-white border-top p-3">
              {replyError && <Alert variant="danger" className="py-2 small">{replyError}</Alert>}
              
              {ticket.status === 'resolved' ? (
                <div className="p-2 bg-light text-center text-muted rounded-2 small fw-semibold">
                  🔏 This support ticket is marked as Resolved. Replying will automatically reopen it.
                </div>
              ) : null}

              <Form onSubmit={handleSendReply} className="mt-2">
                <Form.Group className="mb-3" controlId="replyText">
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Write your response here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                    disabled={replying}
                    className="form-control-earthy"
                  />
                </Form.Group>
                <div className="d-flex justify-content-end">
                  <Button 
                    type="submit" 
                    className="btn-earthy px-4 py-2" 
                    disabled={replying || !replyMessage.trim()}
                    style={{ borderRadius: '6px', fontSize: '0.82rem' }}
                  >
                    {replying ? 'Sending...' : 'Send Message ✉️'}
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>

        {/* Right Column: Ticket Meta / Management Side Card */}
        <Col lg={4}>
          <Card className="card-earthy border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '12px' }}>
            <h5 className="fw-bold text-dark mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>🎫 Ticket Overview</h5>
            
            <div className="d-flex flex-column gap-3">
              <div>
                <span className="text-muted small d-block">Category</span>
                <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{ticket.category}</span>
              </div>

              <div>
                <span className="text-muted small d-block">Created By</span>
                <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
                  {ticket.user.name} <br />
                  <small className="text-muted fw-normal">{ticket.user.email}</small>
                </span>
              </div>

              <div>
                <span className="text-muted small d-block">Created On</span>
                <span className="fw-semibold text-dark" style={{ fontSize: '0.82rem' }}>
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div>
                <span className="text-muted small d-block">Priority Level</span>
                <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{ticket.priority.toUpperCase()}</span>
              </div>
            </div>

            {/* Admin Status Transition Panel */}
            {user.role === 'admin' && (
              <div className="border-top mt-4 pt-4">
                <h5 className="fw-bold text-dark mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>⚙️ Ticket Management</h5>
                
                <Form.Group className="mb-3" controlId="adminStatusSelect">
                  <Form.Label className="small text-muted fw-semibold">Update Ticket Status</Form.Label>
                  <Form.Select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className="form-control-earthy py-2"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </Form.Select>
                </Form.Group>
                
                <p className="text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                  Updating the status to **Resolved** informs the customer that their issue has been successfully resolved.
                </p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SupportTicketDetail;
