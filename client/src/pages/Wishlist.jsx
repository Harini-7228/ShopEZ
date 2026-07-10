import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { toggleWishlistItem, moveWishlistItemToCart } from '../api/wishlistApi';
import { Container, Row, Col, Button, Image, ListGroup, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

/**
 * Wishlist page — uses WishlistContext as the single source of truth.
 * Previously maintained its own duplicate state alongside the context,
 * causing the navbar badge count and the page list to diverge after
 * add/remove operations.
 */
const Wishlist = () => {
  const { wishlist, loading, fetchWishlist } = useWishlist();
  const { fetchCart } = useCart();

  const handleRemove = async (productId) => {
    try {
      const res = await toggleWishlistItem(productId);
      if (res?.success) {
        await fetchWishlist(); // single source — refreshes both page + navbar badge
        toast.success('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      const res = await moveWishlistItemToCart(productId);
      if (res?.success) {
        await Promise.all([fetchWishlist(), fetchCart()]); // sync both contexts
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
    <Container className="py-4">
      <Row>
        <Col md={10} lg={8} className="mx-auto">
          <h3 className="fw-bold text-dark mb-4">My Wishlist</h3>
          <ListGroup className="shadow-sm border rounded overflow-hidden">
            {wishlist.items.map((item) => {
              const product = item.productId;
              if (!product) return null;

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
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
                        }}
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
                        <span className="small fw-bold text-dark">₹{currentPrice}</span>
                        {hasDiscount && (
                          <span className="text-decoration-line-through text-muted small" style={{ fontSize: '0.75rem' }}>
                            ₹{product.price}
                          </span>
                        )}
                        <span className="small text-muted">({inStock ? 'In stock' : 'Out of stock'})</span>
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
