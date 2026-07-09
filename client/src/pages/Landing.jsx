import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Badge, ListGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect logged-in users away from the landing page
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // scrollY state was set but never consumed — removed to eliminate a
  // pointless re-render on every scroll event (memory + CPU waste)

  return (
    <div style={{ background: '#fafafa', paddingTop: '60px' }}>
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Large, impactful header
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%)',
        color: 'white',
        padding: '80px 20px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '60px'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,58,138,0.3) 0%, transparent 70%)',
          bottom: '0px',
          left: '-50px',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(20px); }
          }
        `}</style>

        <Container>
          <Row className="align-items-center" style={{ position: 'relative', zIndex: 2 }}>
            <Col lg={6} className="mb-4 mb-lg-0">
              <div style={{ marginTop: '40px' }}>
                <Badge bg="success" className="mb-3 px-3 py-2 fw-semibold text-uppercase" style={{
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em'
                }}>
                  ✨ Welcome to ShopEZ
                </Badge>

                <h1 style={{
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  marginBottom: '20px',
                  lineHeight: '1.1',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  letterSpacing: '-0.02em'
                }}>
                  Discover Everything You Need
                </h1>

                <p style={{
                  fontSize: '1.1rem',
                  marginBottom: '30px',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: '500px'
                }}>
                  Shop from verified sellers. Premium products, fair prices, and lightning-fast delivery. One platform for groceries, electronics, fashion, and more.
                </p>

                <div className="d-flex flex-wrap gap-3">
                  <Link to="/register" className="btn btn-light text-dark fw-bold px-5 py-3" style={{
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }} onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
                    Start Shopping
                  </Link>
                  <Link to="/login" className="btn border-2 border-white text-white fw-bold px-5 py-3" style={{
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.3s ease'
                  }} onMouseEnter={e => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }} onMouseLeave={e => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}>
                    Sign In
                  </Link>
                </div>

                <div className="d-flex gap-4 mt-5" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>🚀</div>
                    <span>Fast & Reliable</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>🛡️</div>
                    <span>100% Safe</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>💝</div>
                    <span>Best Prices</span>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={6} className="text-center">
              <div style={{
                fontSize: '100px',
                lineHeight: '1',
                marginBottom: '20px',
                animation: 'float 4s ease-in-out infinite'
              }}>
                🛍️
              </div>
              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '20px'
              }}>
                Trusted by millions. Secure checkout. Real-time tracking.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '80px' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '15px',
              color: '#0f172a'
            }}>
              Why Choose ShopEZ?
            </h2>
            <p style={{
              fontSize: '1.05rem',
              color: '#6b7280',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              Everything you love about shopping, reimagined for you
            </p>
          </div>

          <Row className="g-4">
            {[
              {
                icon: '⚡',
                title: 'Lightning Fast',
                desc: 'Same-day delivery in select cities. Real-time tracking from dispatch to your door.'
              },
              {
                icon: '💰',
                title: 'Unbeatable Prices',
                desc: 'Direct from sellers. No middleman markup. Coupon codes for extra savings.'
              },
              {
                icon: '🛡️',
                title: '100% Safe',
                desc: 'Secure payments, buyer protection, and verified sellers. Shop with confidence.'
              },
              {
                icon: '📦',
                title: 'Everything in One',
                desc: 'Groceries, electronics, fashion, toys, books, and much more. 50,000+ products.'
              },
              {
                icon: '⭐',
                title: 'Verified Reviews',
                desc: 'Real customer feedback. Trust scores. See what others bought and loved.'
              },
              {
                icon: '🎁',
                title: 'Rewards & Offers',
                desc: 'Coupon codes, seasonal sales, flash deals, and loyalty rewards every day.'
              }
            ].map((feat, idx) => (
              <Col md={6} lg={4} key={idx}>
                <Card style={{
                  border: 'none',
                  background: 'white',
                  borderRadius: '12px',
                  padding: '30px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{feat.icon}</div>
                  <h5 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    marginBottom: '12px',
                    color: '#0f172a'
                  }}>
                    {feat.title}
                  </h5>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    lineHeight: '1.6'
                  }}>
                    {feat.desc}
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CATEGORIES PREVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '80px', background: '#f3f4f6', padding: '60px 20px', borderRadius: '20px' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '15px',
              color: '#0f172a'
            }}>
              Shop by Category
            </h2>
            <p style={{
              fontSize: '1.05rem',
              color: '#6b7280'
            }}>
              Explore our vast collection across different categories
            </p>
          </div>

          <Row className="g-3">
            {[
              { icon: '🍎', label: 'Groceries', color: '#10b981' },
              { icon: '👕', label: 'Fashion', color: '#f43f5e' },
              { icon: '💻', label: 'Electronics', color: '#3b82f6' },
              { icon: '📱', label: 'Mobiles', color: '#8b5cf6' },
              { icon: '🧸', label: 'Toys', color: '#fbbf24' },
              { icon: '🛋️', label: 'Furniture', color: '#ec4899' },
              { icon: '📚', label: 'Books', color: '#06b6d4' },
              { icon: '⚽', label: 'Sports', color: '#ef4444' },
            ].map((cat, idx) => (
              <Col xs={6} sm={4} lg={3} key={idx}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid transparent`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = cat.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}20`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{cat.icon}</div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {cat.label}
                  </p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '80px' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '15px',
              color: '#0f172a'
            }}>
              What Customers Love
            </h2>
            <p style={{
              fontSize: '1.05rem',
              color: '#6b7280'
            }}>
              Join millions of happy shoppers
            </p>
          </div>

          <Row className="g-4">
            {[
              {
                name: 'Priya Sharma',
                role: 'Delhi',
                text: 'Amazing experience! Delivered in 2 hours. The quality exceeded expectations.',
                rating: 5
              },
              {
                name: 'Raj Patel',
                role: 'Mumbai',
                text: 'Best prices I\'ve found online. The coupon codes save me money every time!',
                rating: 5
              },
              {
                name: 'Anjali Verma',
                role: 'Bangalore',
                text: 'Reliable and trustworthy. Real tracking and verified sellers make all the difference.',
                rating: 5
              },
              {
                name: 'Karan Singh',
                role: 'Pune',
                text: 'Easy returns, great customer support. Shopping has never been simpler.',
                rating: 5
              }
            ].map((testi, idx) => (
              <Col md={6} lg={3} key={idx}>
                <Card style={{
                  border: 'none',
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  background: 'white',
                  height: '100%'
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    {'⭐'.repeat(testi.rating)}
                  </div>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#4b5563',
                    marginBottom: '15px',
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    "{testi.text}"
                  </p>
                  <div>
                    <p style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '0 0 2px 0'
                    }}>
                      {testi.name}
                    </p>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      {testi.role}
                    </p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        color: 'white',
        padding: '80px 20px',
        borderRadius: '20px',
        marginBottom: '60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          bottom: '-50px',
          left: '-50px',
          pointerEvents: 'none'
        }} />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '20px'
          }}>
            Ready to Start Shopping?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px',
            color: 'rgba(255,255,255,0.9)'
          }}>
            Join millions of shoppers who trust ShopEZ for quality, price, and fast delivery.
          </p>
          <Link to="/register" className="btn btn-light text-dark fw-bold px-5 py-3" style={{
            borderRadius: '8px',
            fontSize: '1rem',
            marginRight: '15px',
            display: 'inline-block'
          }}>
            Create Free Account
          </Link>
          <Link to="/login" className="btn btn-outline-light fw-bold px-5 py-3" style={{
            borderRadius: '8px',
            fontSize: '1rem',
            display: 'inline-block'
          }}>
            Already Have Account?
          </Link>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer style={{
        background: '#0f172a',
        color: '#9ca3af',
        padding: '40px 20px',
        borderTop: '1px solid #1e293b'
      }}>
        <Container>
          <Row className="g-4 mb-4">
            <Col md={3}>
              <h6 style={{ color: 'white', marginBottom: '15px', fontWeight: 700 }}>About ShopEZ</h6>
              <ListGroup variant="flush" style={{ fontSize: '0.9rem' }}>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>About Us</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Careers</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Blog</ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={3}>
              <h6 style={{ color: 'white', marginBottom: '15px', fontWeight: 700 }}>For Customers</h6>
              <ListGroup variant="flush" style={{ fontSize: '0.9rem' }}>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Contact Us</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>FAQ</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Shipping Info</ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={3}>
              <h6 style={{ color: 'white', marginBottom: '15px', fontWeight: 700 }}>Policies</h6>
              <ListGroup variant="flush" style={{ fontSize: '0.9rem' }}>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Privacy Policy</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Terms & Conditions</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Return Policy</ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={3}>
              <h6 style={{ color: 'white', marginBottom: '15px', fontWeight: 700 }}>Connect</h6>
              <ListGroup variant="flush" style={{ fontSize: '0.9rem' }}>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Facebook</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Instagram</ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', background: 'transparent', padding: '4px 0', color: '#9ca3af' }}>Twitter</ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '20px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#6b7280'
          }}>
            <p>© 2026 ShopEZ. All rights reserved. | Secure shopping for everyone.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Landing;
