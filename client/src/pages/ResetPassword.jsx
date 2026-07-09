import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { resetPassword } from '../api/authApi';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(token, password);
      setMessage(res.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Please request a new link.');
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
              <h2 className="fw-bold text-dark text-center">Create New Password</h2>
              <p className="text-muted small text-center">Choose a new password for your ShopEZ account.</p>

              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
              {message && <Alert variant="success" className="py-2 small">{message}</Alert>}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="resetPassword">
                  <Form.Label className="small fw-semibold">New password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control-earthy"
                    disabled={submitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="resetConfirmPassword">
                  <Form.Label className="small fw-semibold">Confirm password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control-earthy"
                    disabled={submitting}
                  />
                </Form.Group>

                <Button type="submit" className="btn-earthy w-100 py-2" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
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

export default ResetPassword;
