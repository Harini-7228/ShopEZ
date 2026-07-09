import { useCart as useCartFromContext } from '../context/CartContext';

export const useCart = () => {
  return useCartFromContext();
};
