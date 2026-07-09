import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { requestPasswordReset } from '../api/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetPath, setResetPath] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setResetPath('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestPasswordReset(email);
      setMessage(res.message || 'If an account exists, reset instructions are ready.');
      if (res.data?.resetPath) {
        setResetPath(res.data.resetPath);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create reset link. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-3">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={5}>
          <Card className="card-earthy p-3">
            <Card.Body>
              <h2 className="fw-bold text-dark text-center">Reset Password</h2>
              <p className="text-muted small text-center">Enter your account email to generate a reset link.</p>

              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
              {message && <Alert variant="success" className="py-2 small">{message}</Alert>}
              {resetPath && (
                <Alert variant="info" className="py-2 small">
                  Development reset link:{' '}
                  <Link to={resetPath} className="fw-semibold">Open password reset</Link>
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="forgotEmail">
                  <Form.Label className="small fw-semibold">Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control-earthy"
                    disabled={submitting}
                  />
                </Form.Group>

                <Button type="submit" className="btn-earthy w-100 py-2" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Preparing link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-3 small">
                <Link to="/login" className="text-primary fw-semibold">Back to login</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
