import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Row, Col, Card, ListGroup, Form, Button, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';

// Fix #4: Profile page now has a fully editable form for name, phone, and addresses.
// Fix #21: Avatar CSS fixed — justifyContent instead of justify.

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [addressFormData, setAddressFormData] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  // Sync form fields when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    // Phone format validation (if provided)
    if (formData.phone && !/^[+]?[\d\s\-()]{7,15}$/.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.patch('/auth/me', {
        name: formData.name.trim(),
        phone: formData.phone,
      });

      if (res.data && res.data.success) {
        toast.success('Profile updated successfully');
        await refreshUser(); // Re-fetch user so navbar name updates
        setEditing(false);
      } else {
        setError(res.data?.message || 'Update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setFormData({ name: user.name || '', phone: user.phone || '' });
  };

  const handleAddressChange = (e) => {
    setAddressFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setError('');

    if (!addressFormData.street.trim() || !addressFormData.city.trim() || !addressFormData.state.trim() || !addressFormData.zip.trim() || !addressFormData.country.trim()) {
      setError('Please fill in all address fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.patch('/auth/me', {
        addresses: [...(user.addresses || []), addressFormData],
      });

      if (res.data && res.data.success) {
        toast.success('Address added successfully');
        await refreshUser();
        setEditingAddress(false);
        setAddressFormData({ street: '', city: '', state: '', zip: '', country: '' });
      } else {
        setError(res.data?.message || 'Failed to add address');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAddress = () => {
    setEditingAddress(false);
    setError('');
    setAddressFormData({ street: '', city: '', state: '', zip: '', country: '' });
  };

  const handleDeleteAddress = async (addrId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setSubmitting(true);
      try {
        // Filter by _id, not by array index — index-based deletion is
        // a race condition: if the list re-renders between click and save,
        // the wrong address gets deleted.
        const updatedAddresses = (user.addresses || []).filter(
          (a) => a._id?.toString() !== addrId?.toString()
        );
        const res = await apiClient.patch('/auth/me', { addresses: updatedAddresses });

        if (res.data && res.data.success) {
          toast.success('Address deleted successfully');
          await refreshUser();
        } else {
          setError(res.data?.message || 'Failed to delete address');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete address');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="card-earthy p-4">
            <Card.Body>
              {/* Avatar header */}
              <div className="d-flex align-items-center mb-4">
                {/* Fix #21: justifyContent (was 'justify') */}
                <div
                  className="bg-warning text-white rounded-circle p-3 me-3"
                  style={{
                    width: '60px', height: '60px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 'bold',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="mb-0 text-dark">{user.name}</h3>
                  <p className="text-muted mb-0">{user.email}</p>
                </div>
                {!editing && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="ms-auto border-clay"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Edit Profile
                  </Button>
                )}
              </div>

              {/* Read-only role/phone display OR editable form */}
              {editing ? (
                <Form onSubmit={handleSave} noValidate>
                  {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                  <h5 className="border-bottom pb-2 mb-3 text-secondary">Edit Profile</h5>

                  <Form.Group className="mb-3" controlId="profileName">
                    <Form.Label className="small fw-semibold">Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control-earthy"
                      placeholder="Your full name"
                      disabled={submitting}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="profilePhone">
                    <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-control-earthy"
                      placeholder="e.g. +91 9999999999"
                      disabled={submitting}
                    />
                    <Form.Text className="text-muted small">
                      Email and role cannot be changed here.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2 mt-2">
                    <Button type="submit" className="btn-earthy py-1 px-4" disabled={submitting}>
                      {submitting ? (
                        <><Spinner size="sm" animation="border" className="me-2" />Saving...</>
                      ) : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      className="py-1 px-3 border-clay"
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <>
                  <Row className="mb-4">
                    <Col sm={6} className="mb-3">
                      <div className="p-3 bg-light border rounded">
                        <span className="text-muted d-block small">ACCOUNT ROLE</span>
                        <strong className="text-uppercase text-dark">{user.role}</strong>
                      </div>
                    </Col>
                    <Col sm={6} className="mb-3">
                      <div className="p-3 bg-light border rounded">
                        <span className="text-muted d-block small">PHONE NUMBER</span>
                        <strong className="text-dark">{user.phone || 'N/A'}</strong>
                      </div>
                    </Col>
                    {user.role === 'seller' && (
                      <Col sm={12} className="mb-3">
                        <div className="p-3 spotlight-box border rounded d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted d-block small">MERCHANT TRUST SCORE</span>
                            <strong className="text-success fs-4">{user.sellerImpactScore} / 100</strong>
                            <p className="small text-muted mb-0">Based on order fulfillment speed and verified customer reviews.</p>
                          </div>
                          <div className="fs-1">🛡️</div>
                        </div>
                      </Col>
                    )}
                  </Row>

                  {user.role === 'customer' && (
                    <>
                      <h5 className="border-bottom pb-2 mb-3 text-secondary">Saved Shipping Addresses</h5>
                      {editingAddress ? (
                        <Form onSubmit={handleAddAddress} noValidate className="mb-4">
                          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                          <h6 className="mb-3 text-dark fw-semibold">Add New Address</h6>

                          <Form.Group className="mb-3" controlId="addressStreet">
                            <Form.Label className="small fw-semibold">Street Address *</Form.Label>
                            <Form.Control
                              type="text"
                              name="street"
                              value={addressFormData.street}
                              onChange={handleAddressChange}
                              className="form-control-earthy"
                              placeholder="123 Main St"
                              disabled={submitting}
                              required
                            />
                          </Form.Group>

                          <Row className="mb-3">
                            <Col sm={6}>
                              <Form.Group controlId="addressCity">
                                <Form.Label className="small fw-semibold">City *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="city"
                                  value={addressFormData.city}
                                  onChange={handleAddressChange}
                                  className="form-control-earthy"
                                  placeholder="City"
                                  disabled={submitting}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col sm={6}>
                              <Form.Group controlId="addressState">
                                <Form.Label className="small fw-semibold">State / Province *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="state"
                                  value={addressFormData.state}
                                  onChange={handleAddressChange}
                                  className="form-control-earthy"
                                  placeholder="State"
                                  disabled={submitting}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={6}>
                              <Form.Group controlId="addressZip">
                                <Form.Label className="small fw-semibold">Postal / Zip Code *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="zip"
                                  value={addressFormData.zip}
                                  onChange={handleAddressChange}
                                  className="form-control-earthy"
                                  placeholder="Zip Code"
                                  disabled={submitting}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col sm={6}>
                              <Form.Group controlId="addressCountry">
                                <Form.Label className="small fw-semibold">Country *</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="country"
                                  value={addressFormData.country}
                                  onChange={handleAddressChange}
                                  className="form-control-earthy"
                                  placeholder="Country"
                                  disabled={submitting}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <div className="d-flex gap-2">
                            <Button type="submit" className="btn-earthy py-1 px-4" disabled={submitting}>
                              {submitting ? (
                                <><Spinner size="sm" animation="border" className="me-2" />Saving...</>
                              ) : 'Save Address'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline-secondary"
                              className="py-1 px-3 border-clay"
                              onClick={handleCancelAddress}
                              disabled={submitting}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Form>
                      ) : (
                        <>
                          {user.addresses && user.addresses.length > 0 ? (
                            <ListGroup className="shadow-sm mb-3">
                              {user.addresses.map((addr, idx) => (
                                <ListGroup.Item key={idx} className="p-3 d-flex justify-content-between align-items-start">
                                  <div>
                                    <strong>Address #{idx + 1}</strong>
                                    <p className="mb-0 text-muted small">
                                      {addr.street}, {addr.city}, {addr.state} - {addr.zip}, {addr.country}
                                    </p>
                                  </div>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0 text-decoration-none"
                                    onClick={() => handleDeleteAddress(addr._id)}
                                    disabled={submitting}
                                  >
                                    🗑️ Delete
                                  </Button>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          ) : (
                            <div className="p-3 bg-light text-center border rounded text-muted mb-3">
                              No addresses saved yet.
                            </div>
                          )}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="border-clay"
                            onClick={() => setEditingAddress(true)}
                          >
                            ➕ Add New Address
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
