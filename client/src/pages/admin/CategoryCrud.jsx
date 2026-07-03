import React, { useState, useEffect } from 'react';
import { createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../../api/admin';
import apiClient from '../../api/apiClient';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const CategoryCrud = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data && res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAdminCategory({
        name: name.trim(),
        parentCategory: parentCategory || undefined,
      });

      if (res && res.success) {
        toast.success('Category created successfully');
        setName('');
        setParentCategory('');
        await loadCategories();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (cat) => {
    setEditingId(cat._id);
    setEditName(cat.name);
    setEditParent(cat.parentCategory?._id || cat.parentCategory || '');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditParent('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateAdminCategory(editingId, {
        name: editName.trim(),
        parentCategory: editParent || null, // send null if clearing parent
      });

      if (res && res.success) {
        toast.success('Category updated successfully');
        handleEditCancel();
        await loadCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? Subcategories will remain but have their parent reset to null.')) {
      try {
        const res = await deleteAdminCategory(id);
        if (res && res.success) {
          toast.success('Category deleted successfully');
          await loadCategories();
        }
      } catch (err) {
        toast.error('Failed to delete category');
      }
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-50">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  // Filter out the category itself when setting a parent category in edit mode
  const filteredEditCategories = categories.filter((c) => c._id !== editingId);

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-0">Platform Categories</h3>
        <p className="text-muted small">Manage parent categories and subcategory relationships for search filters.</p>
      </div>

      <Row>
        {/* Category Creation Form */}
        <Col lg={4} className="mb-4">
          <Card className="card-earthy p-4">
            <h5 className="fw-bold text-dark mb-3">Add Category</h5>
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            
            <Form onSubmit={handleCreateSubmit}>
              <Form.Group className="mb-3" controlId="catName">
                <Form.Label className="small fw-semibold text-muted">Category Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Fresh Groceries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control-earthy"
                  disabled={submitting}
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="catParent">
                <Form.Label className="small fw-semibold text-muted">Parent Category (Optional)</Form.Label>
                <Form.Select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="form-control-earthy"
                  disabled={submitting}
                >
                  <option value="">No Parent (Top-level)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button type="submit" className="btn-earthy w-100 py-2 fw-semibold" disabled={submitting}>
                {submitting ? 'Saving...' : 'Add Category'}
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Categories List & Inline editor */}
        <Col lg={8}>
          <Card className="card-earthy p-4">
            <h5 className="fw-bold text-dark mb-3">System Categories ({categories.length})</h5>

            {categories.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="table-earthy align-middle small mb-0">
                  <thead>
                    <tr>
                      <th>Slug</th>
                      <th>Category Name</th>
                      <th>Parent Category</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat._id}>
                        <td className="small font-monospace text-muted">{cat.slug}</td>
                        <td>
                          {editingId === cat._id ? (
                            <Form.Control
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="form-control-earthy py-0 px-2 small"
                              style={{ height: '30px', fontSize: '0.85rem' }}
                            />
                          ) : (
                            <span className="fw-semibold text-dark">{cat.name}</span>
                          )}
                        </td>
                        <td>
                          {editingId === cat._id ? (
                            <Form.Select
                              value={editParent}
                              onChange={(e) => setEditParent(e.target.value)}
                              className="form-control-earthy py-0 px-2 small"
                              style={{ height: '30px', fontSize: '0.85rem' }}
                            >
                              <option value="">None (Top-level)</option>
                              {filteredEditCategories.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                            </Form.Select>
                          ) : (
                            <span className="text-muted">{cat.parentCategory?.name || 'Top-level'}</span>
                          )}
                        </td>
                        <td className="text-end" style={{ minWidth: '150px' }}>
                          {editingId === cat._id ? (
                            <>
                              <Button variant="outline-success" size="sm" className="me-2 py-0 px-2" onClick={handleEditSubmit} disabled={submitting}>
                                Save
                              </Button>
                              <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={handleEditCancel}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline-secondary" size="sm" className="me-2 py-0 px-2 border-clay" onClick={() => handleEditInit(cat)}>
                                Edit
                              </Button>
                              <Button variant="outline-danger" size="sm" className="py-0 px-2 border-clay" onClick={() => handleDelete(cat._id)}>
                                Delete
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="p-3 bg-light text-center border rounded text-muted small">
                No categories defined.
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CategoryCrud;
