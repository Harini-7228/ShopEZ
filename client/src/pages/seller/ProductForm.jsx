import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, createProduct, updateProduct } from '../../api/productsApi';
import apiClient from '../../api/apiClient';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    images: '',
    stock: '0',
    sku: '',
    isLocalListing: false,
  });

  // Dynamic specification builder state
  const [specList, setSpecList] = useState([]);
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFormInfo = async () => {
      setLoading(true);
      try {
        // Fetch categories list
        const catRes = await apiClient.get('/categories');
        if (catRes.data && catRes.data.success) {
          setCategories(catRes.data.data);
        }

        if (isEdit) {
          // Fetch product parameters
          const prodRes = await getProductById(id);
          if (prodRes && prodRes.success) {
            const p = prodRes.data;
            setFormData({
              name: p.name,
              description: p.description || '',
              price: p.price.toString(),
              discountPrice: p.discountPrice ? p.discountPrice.toString() : '',
              category: p.category?._id || p.category || '',
              images: p.images ? p.images.join(', ') : '',
              stock: p.stock.toString(),
              sku: p.sku,
              isLocalListing: p.isLocalListing,
            });

            // Populate specifications
            if (p.specifications) {
              // Convert Map/Object to array of {key, value} pairs
              const specs = Object.entries(p.specifications).map(([k, v]) => ({
                key: k,
                value: v,
              }));
              setSpecList(specs);
            }
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load form details');
      } finally {
        setLoading(false);
      }
    };
    loadFormInfo();
  }, [id, isEdit]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Add a specification row
  const addSpecRow = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) {
      toast.error('Both specification title and description are required');
      return;
    }
    setSpecList((prev) => [...prev, { ...newSpec }]);
    setNewSpec({ key: '', value: '' });
  };

  const removeSpecRow = (idx) => {
    setSpecList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.price || !formData.category || !formData.sku) {
      setError('Please fill in all required fields (Name, Price, Category, SKU)');
      return;
    }

    // Fix #10: Validate numeric ranges
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    if (formData.discountPrice && parseFloat(formData.discountPrice) <= 0) {
      setError('Discount price must be greater than 0 if provided');
      return;
    }
    if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
      setError('Discount price must be lower than the regular price');
      return;
    }
    if (parseInt(formData.stock, 10) < 0) {
      setError('Stock quantity cannot be negative');
      return;
    }

    setSubmitting(true);

    // Format specifications back into object
    const specificationsObj = {};
    specList.forEach((item) => {
      specificationsObj[item.key.trim()] = item.value.trim();
    });

    // Validate and format image URLs
    const imagesArr = formData.images
      ? formData.images
          .split(',')
          .map((img) => img.trim())
          .filter((img) => {
            if (!img) return false;
            try { new URL(img); return true; } catch { return false; }
          })
      : [];

    if (formData.images && imagesArr.length === 0) {
      setError('Please enter valid image URLs (must start with http:// or https://)');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
      category: formData.category,
      images: imagesArr,
      stock: parseInt(formData.stock, 10),
      sku: formData.sku,
      isLocalListing: formData.isLocalListing,
      specifications: specificationsObj,
    };

    try {
      let res;
      if (isEdit) {
        res = await updateProduct(id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res && res.success) {
        toast.success(isEdit ? 'Product listing updated!' : 'Product listing created!');
        navigate('/seller');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-50">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-2">
      <div className="mb-4">
        <Link to="/seller" className="text-decoration-none small text-muted">&larr; Back to Dashboard</Link>
        <h3 className="fw-bold text-dark mt-1">{isEdit ? 'Edit Product Listing' : 'Create New Listing'}</h3>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleFormSubmit}>
        <Row>
          {/* General Fields */}
          <Col lg={7}>
            <Card className="card-earthy p-4 mb-4">
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Product Information</h5>

              <Form.Group className="mb-3" controlId="prodName">
                <Form.Label className="small fw-semibold text-muted">Product Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control-earthy"
                  placeholder="e.g. Organic Strawberries"
                  disabled={submitting}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="prodDesc">
                <Form.Label className="small fw-semibold text-muted">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-control-earthy"
                  placeholder="Tell buyers about this product, origins, and sustainability info..."
                  disabled={submitting}
                />
              </Form.Group>

              <Row className="mb-3">
                <Col sm={6}>
                  <Form.Group controlId="prodPrice">
                    <Form.Label className="small fw-semibold text-muted">Price (₹) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="form-control-earthy"
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="prodDiscount">
                    <Form.Label className="small fw-semibold text-muted">Discount Price (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="discountPrice"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                      className="form-control-earthy"
                      placeholder="Optional"
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="prodImages">
                <Form.Label className="small fw-semibold text-muted">Images URLs (Comma separated)</Form.Label>
                <Form.Control
                  type="text"
                  name="images"
                  value={formData.images}
                  onChange={handleInputChange}
                  className="form-control-earthy"
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  disabled={submitting}
                />
              </Form.Group>
            </Card>

            {/* Product Specifications builder */}
            <Card className="card-earthy p-4">
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Specifications (Key-Values)</h5>
              
              {specList.length > 0 && (
                <Table striped bordered hover size="sm" className="table-earthy small mb-3">
                  <thead>
                    <tr>
                      <th>Specification Title</th>
                      <th>Detail / Value</th>
                      <th className="text-center" style={{ width: '80px' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specList.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-capitalize">{item.key}</td>
                        <td>{item.value}</td>
                        <td className="text-center">
                          <Button variant="link" size="sm" className="text-danger p-0" onClick={() => removeSpecRow(idx)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              <Row className="g-2 align-items-end">
                <Col sm={5}>
                  <Form.Group controlId="specKey">
                    <Form.Label className="small text-muted">Title (e.g. Origin)</Form.Label>
                    <Form.Control
                      type="text"
                      value={newSpec.key}
                      onChange={(e) => setNewSpec((prev) => ({ ...prev, key: e.target.value }))}
                      className="form-control-earthy py-1 px-2 small"
                      placeholder="e.g. Origin"
                    />
                  </Form.Group>
                </Col>
                <Col sm={5}>
                  <Form.Group controlId="specVal">
                    <Form.Label className="small text-muted">Detail (e.g. brand origin)</Form.Label>
                    <Form.Control
                      type="text"
                      value={newSpec.value}
                      onChange={(e) => setNewSpec((prev) => ({ ...prev, value: e.target.value }))}
                      className="form-control-earthy py-1 px-2 small"
                      placeholder="e.g. Premium Brand Origin"
                    />
                  </Form.Group>
                </Col>
                <Col sm={2}>
                  <Button type="button" onClick={addSpecRow} className="btn-earthy-outline btn-sm w-100 py-1">
                    Add Spec
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Sidebar parameters */}
          <Col lg={5}>
            <Card className="card-earthy p-4">
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Inventory Settings</h5>

              <Form.Group className="mb-3" controlId="prodCat">
                <Form.Label className="small fw-semibold text-muted">Category *</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-control-earthy"
                  disabled={submitting}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="prodSku">
                <Form.Label className="small fw-semibold text-muted">SKU (Unique Code) *</Form.Label>
                <Form.Control
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="form-control-earthy"
                  placeholder="e.g. FRT-STR-100"
                  disabled={submitting || isEdit} // SKU shouldn't be editable to prevent unique constraint conflicts
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="prodStock">
                <Form.Label className="small fw-semibold text-muted">Initial Stock Quantity</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="form-control-earthy"
                  placeholder="0"
                  disabled={submitting}
                />
              </Form.Group>

              <Form.Group className="mb-4 bg-light p-3 border rounded" controlId="prodLocal">
                <Form.Check
                  type="checkbox"
                  name="isLocalListing"
                  label="Flag as Premium Featured Product"
                  checked={formData.isLocalListing}
                  onChange={handleInputChange}
                  className="fw-semibold text-primary"
                />
                <Form.Text className="text-muted d-block mt-1">
                  Highlights this product on the premium featured collections grid.
                </Form.Text>
              </Form.Group>

              <Button
                type="submit"
                className="btn-earthy w-100 py-2 fw-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Saving Listing...
                  </>
                ) : (
                  isEdit ? 'Save Changes' : 'Create Product'
                )}
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default ProductForm;
