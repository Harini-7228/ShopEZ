import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

/**
 * Route guard component to protect role-specific paths.
 * @param {React.ReactNode} children - Component to mount if access is permitted
 * @param {Array<string>} allowedRoles - List of authorized roles (e.g. ['admin', 'seller'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Row>
          <Col className="text-center">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 text-muted">Checking authentication session...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  // Redirect to login if user session does not exist
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home if unauthorized
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
