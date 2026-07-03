import React, { useState, useEffect } from 'react';
import { getAdminUsers, updateUserRole, deleteUserByAdmin } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { Container, Table, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentAdmin } = useAuth();

  const loadUsers = async () => {
    try {
      const res = await getAdminUsers();
      if (res && res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user accounts list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await updateUserRole(userId, newRole);
      if (res && res.success) {
        toast.success('User role successfully updated');
        // Update local state without full list reload
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentAdmin._id) {
      toast.error('Self-deletion of admin accounts is restricted');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user account permanently?')) {
      try {
        const res = await deleteUserByAdmin(userId);
        if (res && res.success) {
          toast.success('User deleted successfully');
          setUsers((prev) => prev.filter((u) => u._id !== userId));
        }
      } catch (err) {
        toast.error('Failed to delete user');
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

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-0">Platform User Accounts</h3>
        <p className="text-muted small">Update user roles or delete user listings across the platform.</p>
      </div>

      <div className="table-responsive">
        <Table hover className="table-earthy align-middle small">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Current Role</th>
              <th>Update Access Role</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td className="small font-monospace text-muted">{u._id}</td>
                <td className="fw-semibold text-dark">
                  {u.name}{' '}
                  {u._id === currentAdmin._id && <Badge bg="danger" className="ms-1" style={{ fontSize: '0.65rem' }}>You</Badge>}
                </td>
                <td>{u.email}</td>
                <td>{u.phone || 'N/A'}</td>
                <td>
                  <Badge bg={u.role === 'admin' ? 'danger' : u.role === 'seller' ? 'success' : u.role === 'delivery' ? 'info' : 'secondary'} className="badge-status">
                    {u.role}
                  </Badge>
                </td>
                <td style={{ maxWidth: '160px' }}>
                  <Form.Select
                    size="sm"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    disabled={u._id === currentAdmin._id}
                    className="form-control-earthy py-0 px-2 small"
                    style={{ height: '30px', fontSize: '0.85rem' }}
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                    <option value="delivery">Delivery</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </td>
                <td className="text-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="py-0 px-2 border-clay"
                    onClick={() => handleDeleteUser(u._id)}
                    disabled={u._id === currentAdmin._id}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
