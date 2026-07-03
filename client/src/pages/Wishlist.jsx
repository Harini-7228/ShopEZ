import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getWishlist, toggleWishlistItem, moveWishlistItemToCart } from '../api/wishlist';
import { Container, Row, Col, Card, Button, Image, ListGroup, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchCart } = useCart();

  const loadWishlist = async () => {
    try {
      const res = await getWishlist();
      if (res && res.success) {
        setWishlist(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const res = await toggleWishlistItem(productId);
      if (res && res.success) {
        setWishlist(res.data);
        toast.success('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      const res = await moveWishlistItemToCart(productId);
      if (res && res.success) {
        setWishlist(res.data.wishlist);
        await fetchCart(); // refresh Cart count badge in navbar
        toast.success('Moved item to cart');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move item to cart');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center min-vh-75">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return (
      <Container className="py-3 text-center text-muted d-flex flex-column align-items-center justify-content-center">
        <div className="fs-1 mb-3">❤️</div>
        <h4>Your Wishlist is Empty</h4>
        <p className="small mb-4">Save products you like here to purchase them later.</p>
        <Link to="/products" className="btn-earthy">Browse Products</Link>
      </Container>
    );
  }

  return (
    <Container className="py-4 ">
      <h3 className="fw-bold text-dark mb-4">My Wishlist</h3>
      <Row>
        <Col md={10} lg={8} className="mx-auto">
          <ListGroup className="shadow-sm border rounded overflow-hidden">
            {wishlist.items.map((item) => {
              const product = item.productId;
              if (!product) return null;

              // Fix #13: discountPrice=0 must not fall back to full price
              const currentPrice = (product.discountPrice != null && product.discountPrice > 0)
                ? product.discountPrice
                : product.price;
              const hasDiscount = product.discountPrice != null && product.discountPrice > 0;
              const inStock = product.stock > 0;

              return (
                <ListGroup.Item key={item._id} className="p-3">
                  <Row className="align-items-center">
                    <Col xs={3} sm={2}>
                      <Image
                        src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                        rounded
                        fluid
                        style={{ height: '70px', width: '70px', objectFit: 'cover' }}
                      />
                    </Col>
                    
                    <Col xs={9} sm={5} className="mb-2 mb-sm-0">
                      <h6 className="fw-bold text-dark mb-1">
                        <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
                          {product.name}
                        </Link>
                      </h6>
                      <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold text-dark">
                          ₹{currentPrice}
                        </span>
                        {hasDiscount && (
                          <span className="text-decoration-line-through text-muted small" style={{ fontSize: '0.75rem' }}>
                            ₹{product.price}
                          </span>
                        )}
                        <span className="small text-muted font-monospace">
                          ({inStock ? 'In stock' : 'Out of stock'})
                        </span>
                      </div>
                    </Col>
                    
                    <Col xs={12} sm={5} className="text-sm-end mt-2 mt-sm-0">
                      <Button
                        onClick={() => handleMoveToCart(product._id)}
                        disabled={!inStock}
                        className="btn-earthy btn-sm me-2 py-1 px-3"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleRemove(product._id)}
                        className="btn-sm py-1 border-clay"
                      >
                        Remove
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default Wishlist;
