import productService from "../../services/product.service";

import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
} from "./productSlice";

export const fetchProducts =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(fetchProductsStart());

      const response = await productService.getProducts(params);

      dispatch(
        fetchProductsSuccess({
          products: response?.data?.products || [],
          pagination: response?.data?.pagination || {},
        }),
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch products";

      dispatch(fetchProductsFailure(message));
    }
  };
