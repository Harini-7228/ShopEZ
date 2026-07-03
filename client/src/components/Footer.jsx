import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-earthy pt-4 pb-3 mt-auto">
      <Container>
        <Row className="gy-4">
          <Col md={4} lg={5}>
            <h5 className="mb-3 text-white">🛍️ ShopEZ Marketplace</h5>
            <p className="small mb-0" style={{ maxWidth: '400px' }}>
              ShopEZ is a premium marketplace connecting you with leading brands, curated crafts, and verified merchant listings. Enjoy seamless tracking, verified product reviews, and personalized recommendations.
            </p>
          </Col>
          <Col md={4} lg={3}>
            <h6 className="text-uppercase text-white mb-3">Quick Links</h6>
            <ul className="list-unstyled small mb-0">
              <li className="mb-2">
                <Link to="/products">Browse Catalog</Link>
              </li>
              <li className="mb-2">
                <Link to="/products?featuredOnly=true">Featured Highlights</Link>
              </li>
              <li className="mb-2">
                <Link to="/register?role=seller">Become a Partner</Link>
              </li>
            </ul>
          </Col>
          <Col md={4} lg={4}>
            <h6 className="text-uppercase text-white mb-3">Verified Purchase Security</h6>
            <div className="p-3 border border-secondary rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <p className="small mb-0 text-white-50">
                🛡️ <strong>Buyer Guarantee:</strong> Every transaction is encrypted, tracked from warehouse to doorstep, and backed by authentic customer reviews for complete peace of mind.
              </p>
            </div>
          </Col>
        </Row>
        <hr className="my-3 border-secondary" style={{ opacity: 0.2 }} />
        <Row className="small align-items-center">
          <Col md={6} className="text-center text-md-start">
            &copy; {new Date().getFullYear()} ShopEZ Inc. All rights reserved.
          </Col>
          <Col md={6} className="text-center text-md-end mt-2 mt-md-0 text-white-50">
            Premium Shopping Experience, Guaranteed.
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
