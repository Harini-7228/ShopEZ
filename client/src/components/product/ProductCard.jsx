import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';

/**
 * ProductCard — memoized so lists of 16–50 cards don't re-render
 * when unrelated parent state changes (e.g. cart count update in Navbar).
 *
 * Removed useLocation() — it was called on every card in a grid just to
 * build a `from` state string. The hook triggers a re-render subscription
 * for every card whenever the location changes. Passed as a prop instead
 * when the caller genuinely needs it; otherwise omitted.
 */
const ProductCard = memo(({ product, showDetails = true, fromPath = '' }) => {
  if (!product) return null;

  const currentPrice =
    product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;

  const inStock = product.stock > 0;
  const detailState = fromPath ? { from: fromPath } : undefined;

  return (
    <Card
      className="card-earthy h-100 flex-column border-0"
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      <div
        className="position-relative overflow-hidden"
        style={{ borderRadius: '16px 16px 0 0' }}
        role="img"
        aria-label={`Product image: ${product.name}`}
      >
        <Card.Img
          variant="top"
          src={
            product.images?.[0] ||
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'
          }
          loading="lazy"
          style={{ height: '160px', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          className="hover-zoom-img"
        />

        {product.isLocalListing && (
          <Badge bg="success" className="position-absolute m-3 top-0 start-0 badge-status">
            Featured
          </Badge>
        )}

        {!inStock && (
          <Badge bg="secondary" className="position-absolute m-3 top-0 end-0 badge-status">
            Out of stock
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column p-2">
        <Card.Title className="fs-6 fw-bold mb-2 text-dark text-truncate">
          <Link
            to={`/products/${product._id}`}
            state={detailState}
            className="text-decoration-none text-dark hover-text-primary"
          >
            {product.name}
          </Link>
        </Card.Title>

        <div className="mt-auto pt-1 border-top border-light">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                ₹{currentPrice.toFixed(2)}
              </span>
              {product.discountPrice > 0 && (
                <span
                  className="text-decoration-line-through text-muted small ms-2"
                  style={{ fontSize: '0.7rem' }}
                >
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </div>

            {showDetails && product._id && (
              <Link
                to={`/products/${product._id}`}
                state={detailState}
                className="btn btn-earthy btn-sm py-1 px-2 text-white small"
                style={{ fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block' }}
              >
                Details
              </Link>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
