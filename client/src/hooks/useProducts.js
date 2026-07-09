import { useState, useCallback } from 'react';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductStock, getRelatedProducts } from '../api/productsApi';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(params);
      if (data?.success) {
        setProducts(data.data?.products || []);
        setTotalProducts(data.data?.total || 0);
        setTotalPages(data.data?.pages || 0);
      } else {
        setError(data?.message || 'Failed to fetch products');
      }
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(id);
      if (data?.success) {
        setProduct(data.data);
      } else {
        setError(data?.message || 'Failed to fetch product');
      }
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    product,
    loading,
    error,
    totalProducts,
    totalPages,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getRelatedProducts,
  };
};
