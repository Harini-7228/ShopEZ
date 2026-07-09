import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const renderSellerLinks = () => (
    <>
      <div className="small text-muted text-uppercase fw-bold mb-3 px-3">Seller Portal</div>
      <Nav.Link as={NavLink} to="/seller" end className="sidebar-link px-3 py-2 mb-2">
        📊 Dashboard Overview
      </Nav.Link>
      <Nav.Link as={NavLink} to="/seller/products" className="sidebar-link px-3 py-2 mb-2">
        📦 My Products
      </Nav.Link>
      <Nav.Link as={NavLink} to="/seller/orders" className="sidebar-link px-3 py-2 mb-2">
        🛒 Orders Fulfilled
      </Nav.Link>
    </>
  );

  const renderAdminLinks = () => (
    <>
      <div className="small text-muted text-uppercase fw-bold mb-3 px-3">Admin Suite</div>
      <Nav.Link as={NavLink} to="/admin" end className="sidebar-link px-3 py-2 mb-2">
        📈 Platform Dashboard
      </Nav.Link>
      <Nav.Link as={NavLink} to="/admin/categories" className="sidebar-link px-3 py-2 mb-2">
        🏷️ Category CRUD
      </Nav.Link>
      <Nav.Link as={NavLink} to="/admin/users" className="sidebar-link px-3 py-2 mb-2">
        👥 User Roles Management
      </Nav.Link>
      <Nav.Link as={NavLink} to="/admin/orders" className="sidebar-link px-3 py-2 mb-2">
        📋 System Orders List
      </Nav.Link>
    </>
  );

  const renderDeliveryLinks = () => (
    <>
      <div className="small text-muted text-uppercase fw-bold mb-3 px-3">Delivery Ops</div>
      <Nav.Link as={NavLink} to="/delivery" end className="sidebar-link px-3 py-2 mb-2">
        🚚 Assigned Shipments
      </Nav.Link>
    </>
  );

  return (
    <div className="sidebar-earthy h-100 shadow-sm rounded">
      <Nav className="flex-column">
        {user.role === 'seller' && renderSellerLinks()}
        {user.role === 'admin' && renderAdminLinks()}
        {user.role === 'delivery' && renderDeliveryLinks()}
      </Nav>
    </div>
  );
};

export default Sidebar;
