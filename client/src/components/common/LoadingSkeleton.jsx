import React from 'react';
import { Card, Col } from 'react-bootstrap';

/**
 * ProductSkeleton — renders `count` placeholder cards inside Col wrappers
 * matching the same grid breakpoints used by the product grid so there is
 * no layout shift when real cards load in.
 *
 * Usage inside an existing <Row>:
 *   <ProductSkeleton count={8} />
 */
export const ProductSkeleton = ({ count = 1 }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <Col key={i} xs={6} sm={4} md={3}>
        <Card className="card-earthy h-100 border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
          <div className="placeholder-glow">
            <div
              className="placeholder col-12 mb-3 rounded-2"
              style={{ height: '160px' }}
            />
            <div className="placeholder col-8 mb-2" />
            <div className="placeholder col-5" />
          </div>
        </Card>
      </Col>
    ))}
  </>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="placeholder-glow mb-2">
        <div className="placeholder col-12 rounded" style={{ height: '40px' }} />
      </div>
    ))}
  </>
);

export const DetailSkeleton = () => (
  <div className="placeholder-glow">
    <div className="placeholder col-6 mb-3 rounded" style={{ height: '30px' }} />
    <div className="placeholder col-12 mb-2 rounded" style={{ height: '200px' }} />
    <div className="placeholder col-8 mb-2 rounded" />
    <div className="placeholder col-5 rounded" />
  </div>
);
