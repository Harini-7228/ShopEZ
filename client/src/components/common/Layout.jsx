import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppNavbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { Container, Row, Col } from 'react-bootstrap';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  const location = useLocation();
  const path = location.pathname;

  // Determine if this is a dashboard route requiring the sidebar
  const isDashboard =
    path.startsWith('/seller') || path.startsWith('/admin') || path.startsWith('/delivery');

  return (
    <div className="d-flex flex-column min-vh-100 bg-creamy">
      <AppNavbar />
      
      {/* react-hot-toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontSize: '0.82rem',
            padding: '8px 14px',
            maxWidth: '280px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#047857', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#be123c', secondary: '#fff' } },
        }}
      />

      <main className="flex-grow-1 py-2">
        {isDashboard ? (
          <Container fluid className="px-lg-5">
            <Row className="align-items-stretch">
              <Col xs={12} md={3} lg={3} className="mb-4 d-flex flex-column sidebar-custom">
                <Sidebar />
              </Col>
              <Col xs={12} md={9} lg={9} className="mb-4 d-flex flex-column grid-custom">
                <div className="card-earthy p-4 min-vh-50 flex-grow-1">
                  <Outlet />
                </div>
              </Col>
            </Row>
          </Container>
        ) : (
          <Container fluid className="px-3 px-xl-5">
            <Outlet key={location.key} />
          </Container>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
