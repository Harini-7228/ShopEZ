import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // If ProtectedRoute redirected here, restore the originally intended path after login
  const from = location.state?.from || null;

  // Fix #14: Redirect already-logged-in users away from /login
  if (!loading && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'seller') return <Navigate to="/seller" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery" replace />;
    return <Navigate to="/" replace />;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Fix #6: Client-side email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    const result = await loginUser(email, password);
    setSubmitting(false);

    if (result && result.success) {
      const { role } = result.user;
      // If coming from a protected route, go back there; otherwise use role default
      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'seller') {
        navigate('/seller');
      } else if (role === 'delivery') {
        navigate('/delivery');
      } else {
        navigate('/');
      }
    } else {
      setError(result?.error || 'Login failed');
    }
  };

  return (
    <Container className="py-3">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={5}>
          <Card className="card-earthy p-3">
            <Card.Body>
              <div className="text-center mb-2">
                <h2 className="fw-bold text-dark">🛍️ Welcome Back</h2>
                <p className="text-muted small">Access your ShopEZ account dashboard</p>
              </div>

              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

              <Form onSubmit={handleFormSubmit} noValidate>
                <Form.Group className="mb-3" controlId="loginEmail">
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

                <Form.Group className="mb-2" controlId="loginPassword">
                  <Form.Label className="small fw-semibold">Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control-earthy"
                      disabled={submitting}
                    />
                    <Button
                      variant="outline-secondary"
                      className="small"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitting}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️‍🗨️' : '👁️'}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Button
                  type="submit"
                  className="btn-earthy w-100 py-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Authenticating...
                    </>
                  ) : (
                    'Log In'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-2 small text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary fw-semibold">
                  Register here
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
