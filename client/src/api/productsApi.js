import apiClient from './apiClient';

export const getProducts = async (params = {}, options = {}) => {
  const res = await apiClient.get('/products', { params, ...options });
  return res.data;
};

export const getProductById = async (id) => {
  const res = await apiClient.get(`/products/${id}`);
  return res.data;
};

export const createProduct = async (data) => {
  const res = await apiClient.post('/products', data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await apiClient.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await apiClient.delete(`/products/${id}`);
  return res.data;
};

export const updateProductStock = async (id, stock) => {
  const res = await apiClient.patch(`/products/${id}/stock`, { stock });
  return res.data;
};
export const getRelatedProducts = async (categoryId, excludeProductId) => {
  try {
    const res = await apiClient.get('/products', {
      params: {
        category: categoryId,
        limit: 6,
        inStock: true
      }
    });
    
    if (res.data && res.data.success && res.data.data.products) {
      return {
        success: true,
        data: res.data.data.products.filter(p => p._id !== excludeProductId)
      };
    }
    return { success: false, data: [] };
  } catch (err) {
    console.error('Failed to fetch related products:', err);
    return { success: false, data: [] };
  }
};
