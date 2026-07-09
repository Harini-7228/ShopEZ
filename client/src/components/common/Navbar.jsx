import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Form, FormControl, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const AppNavbar = memo(() => {
  const { user, logoutUser } = useAuth();
  const { cartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // If search query changes on URL, sync local input
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // If user is logged in, search from home; otherwise show message
    if (!user) {
      navigate('/login');
      return;
    }
    // Direct search queries to the unified home page portal
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    // logoutUser() in AuthContext already fires a success toast — don't duplicate it
    logoutUser();
    navigate('/');
  };

  return (
    <Navbar expand="lg" variant="light" className="navbar-earthy shadow-sm sticky-top">
      <Container fluid className="px-3 px-xl-5">
        <Navbar.Brand as={Link} to={user ? "/" : "/landing"} className="navbar-brand-earthy me-4">
          🛍️ ShopEZ
        </Navbar.Brand>
        
        {/* Responsive toggle */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Centered Wide Search Bar */}
          <Form className="d-flex flex-grow-1 my-2 my-lg-0 mx-lg-5 justify-content-center" onSubmit={handleSearchSubmit}>
            <div className="input-group" style={{ maxWidth: '600px', width: '100%' }}>
              <FormControl
                type="search"
                placeholder="Search products, premium brands, crafts..."
                className="form-control-earthy border-end-0 rounded-0 rounded-start py-2 px-3"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="btn-earthy rounded-0 rounded-end px-4" style={{ zIndex: 4 }}>
                Search
              </Button>
            </div>
          </Form>

          {/* Right Side Navigation */}
          <Nav className="align-items-center ms-auto">
            {user ? (
              <Nav.Link as={Link} to="/" className="px-3 fw-bold text-dark">
                Explore
              </Nav.Link>
            ) : (
              <Nav.Link as={Link} to="/landing" className="px-3 fw-bold text-dark">
                Explore
              </Nav.Link>
            )}

            {/* Wishlist and Cart Links - only shown to logged-in customers */}
            {user && user.role === 'customer' && (
              <>
                <Nav.Link as={Link} to="/wishlist" className="px-3 fw-bold text-dark">
                  ❤️ Wishlist
                </Nav.Link>

                <Nav.Link as={Link} to="/cart" className="position-relative px-3 fw-bold text-dark">
                  <span className="position-relative">
                    {cartItemCount > 0 && (
                      <Badge pill bg="danger" className="position-absolute top-0 start-0 translate-middle" style={{ fontSize: '0.55rem', padding: '0.15rem 0.35rem' }}>
                        {cartItemCount}
                      </Badge>
                    )}
                    <span className="fs-5">🛒</span>
                  </span>
                  <span className="d-none d-lg-inline ms-1">Cart</span>
                </Nav.Link>
              </>
            )}

            {/* User Account / Login Triggers */}
            {user ? (
              <NavDropdown
                title={
                  <span className="d-inline-flex align-items-center gap-2 fw-semibold text-dark">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #b45309, #d97706)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(180,83,9,0.35)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    {user.name}
                  </span>
                }
                id="profile-dropdown"
                className="px-2"
              >
                <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item>
                
                {user.role === 'customer' && (
                  <>
                    <NavDropdown.Item as={Link} to="/wishlist">My Wishlist</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/orders/history">Order History</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/alerts">My Alerts</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/reorders">Reorders</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/support">Customer Support</NavDropdown.Item>
                  </>
                )}

                {user.role === 'seller' && (
                  <NavDropdown.Item as={Link} to="/seller">Seller Dashboard</NavDropdown.Item>
                )}

                {user.role === 'delivery' && (
                  <NavDropdown.Item as={Link} to="/delivery">Delivery Board</NavDropdown.Item>
                )}

                {user.role === 'admin' && (
                  <>
                    <NavDropdown.Item as={Link} to="/admin">Admin Stats</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/categories">Categories CRUD</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/users">User Management</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/orders">Platform Orders</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/support">Support Tickets</NavDropdown.Item>
                  </>
                )}
                
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger">
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="px-3 fw-bold text-dark">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="px-3 fw-bold text-dark">
                  Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

AppNavbar.displayName = 'AppNavbar';

export default AppNavbar;
