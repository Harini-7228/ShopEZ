import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge } from 'react-bootstrap';

// Password strength checker function
const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;  // Uppercase
  if (/[a-z]/.test(password)) strength++;  // Lowercase
  if (/[0-9]/.test(password)) strength++;  // Numbers
  if (/[^A-Za-z0-9]/.test(password)) strength++;  // Special chars
  
  if (strength <= 2) return { level: 'Weak', color: 'danger', width: '33%' };
  if (strength <= 4) return { level: 'Fair', color: 'warning', width: '66%' };
  return { level: 'Strong', color: 'success', width: '100%' };
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',   // Fix #3: Added confirm password field
    role: 'customer',
    phone: '',
    isLocalSeller: false,
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const { user, loading, registerUser } = useAuth();
  const navigate = useNavigate();

  // Fix #15: Redirect already-logged-in users away from /register
  if (!loading && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'seller') return <Navigate to="/seller" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery" replace />;
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Track password strength
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields (Name, Email, Password)');
      return;
    }

    // Fix #6: Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }



    // Fix #3: Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    // Fix #23: Phone number format validation (if provided)
    if (formData.phone && !/^[+]?[\d\s\-()]{7,15}$/.test(formData.phone)) {
      setError('Please enter a valid phone number (digits, spaces, +, - allowed)');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
      isLocalSeller: formData.role === 'seller' ? formData.isLocalSeller : false,
      addresses: [], // Address can be added later from profile page
    };

    const result = await registerUser(payload);
    setSubmitting(false);

    if (result && result.success) {
      const { role } = result.user;
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'seller') {
        navigate('/seller');
      } else if (role === 'delivery') {
        navigate('/delivery');
      } else {
        navigate('/');
      }
    } else {
      setError(result?.error || 'Registration failed');
    }
  };

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="card-earthy p-3">
            <Card.Body>
              <div className="text-center mb-2">
                <h2 className="fw-bold text-dark">🛍️ Join ShopEZ</h2>
                <p className="text-muted small">Connect, browse, and shop premium brands</p>
              </div>

              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

              <Form onSubmit={handleFormSubmit} noValidate>
                <h5 className="border-bottom pb-1 mb-2 text-secondary">Account Credentials</h5>
                
                <Form.Group className="mb-2" controlId="regName">
                  <Form.Label className="small fw-semibold">Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control-earthy"
                    disabled={submitting}
                  />
                </Form.Group>

                <Form.Group className="mb-2" controlId="regEmail">
                  <Form.Label className="small fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control-earthy"
                    disabled={submitting}
                  />
                </Form.Group>

                <Row className="mb-2">
                  <Col sm={6}>
                    <Form.Group controlId="regPassword">
                      <Form.Label className="small fw-semibold">Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="form-control-earthy"
                        disabled={submitting}
                      />
                      
                      {/* Password Strength Meter */}
                      {formData.password && passwordStrength && (
                        <div className="mt-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Password Strength</small>
                            <Badge bg={passwordStrength.color} className="small">
                              {passwordStrength.level}
                            </Badge>
                          </div>
                          <div className="progress" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar bg-${passwordStrength.color}`}
                              style={{ width: passwordStrength.width }}
                            />
                          </div>
                          <ul className="password-strength-requirements">
                            <li>✓ At least 8 characters</li>
                            <li>✓ Mix of uppercase and lowercase</li>
                            <li>✓ Include numbers and special characters</li>
                          </ul>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    {/* Fix #3: Confirm password field */}
                    <Form.Group controlId="regConfirmPassword">
                      <Form.Label className="small fw-semibold">Confirm Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-control-earthy ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-danger'
                            : formData.confirmPassword && formData.password === formData.confirmPassword
                            ? 'border-success'
                            : ''
                        }`}
                        disabled={submitting}
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <Form.Text className="text-danger small">Passwords do not match</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-2">
                  <Col sm={6}>
                    {/* Fix #4/#7: Removed 'delivery' from self-registration options */}
                    <Form.Group controlId="regRole">
                      <Form.Label className="small fw-semibold">I want to register as *</Form.Label>
                      <Form.Select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="form-control-earthy"
                        disabled={submitting}
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        {/* Delivery Manager is an admin-assigned role — not self-registrable */}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    {/* Fix #23: Added phone validation hint */}
                    <Form.Group controlId="regPhone">
                      <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        placeholder="e.g. +91 9999999999"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-control-earthy"
                        disabled={submitting}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Optional — digits, +, - allowed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Seller check fields */}
                {formData.role === 'seller' && (
                  <Form.Group className="mb-3 bg-light p-3 border rounded" controlId="regIsLocalSeller">
                    <Form.Check
                      type="checkbox"
                      name="isLocalSeller"
                      label="Featured Premium Seller"
                      checked={formData.isLocalSeller}
                      onChange={handleInputChange}
                      className="fw-semibold text-primary"
                    />
                    <Form.Text className="text-muted d-block mt-1">
                      Premium sellers get higher storefront spotlight visibility and verified merchant trust scores.
                    </Form.Text>
                  </Form.Group>
                )}

                <Button
                  type="submit"
                  className="btn-earthy w-100 py-2 mt-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-2 small text-muted">
                Already registered?{' '}
                <Link to="/login" className="text-primary fw-semibold">
                  Login here
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
