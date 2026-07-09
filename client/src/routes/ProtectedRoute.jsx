import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

/**
 * Route guard component to protect role-specific paths.
 * Preserves the originally requested path so the user is redirected
 * back to it after a successful login (instead of always going to "/").
 *
 * @param {React.ReactNode} children    - Component to render if access is granted
 * @param {Array<string>}   allowedRoles - Roles that may access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // Pass the current path in location state so Login can redirect back after success
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Send each role to their own dashboard instead of the generic home page
    const dashboardByRole = {
      seller:   '/seller',
      admin:    '/admin',
      delivery: '/delivery',
      customer: '/',
    };
    const redirectTo = dashboardByRole[user.role] ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
