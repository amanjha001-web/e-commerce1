
import productService from "../../services/product.service";

import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
} from "./productSlice";

// =========================
// Fetch Products
// =========================

export const fetchProducts =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(fetchProductsStart());

      const response = await productService.getProducts(params);

      // Support different API response structures.
      const data = response?.data;

      let products = [];

      if (Array.isArray(data)) {
        products = data;
      } else if (Array.isArray(data?.products)) {
        products = data.products;
      } else if (Array.isArray(data?.data)) {
        products = data.data;
      } else if (Array.isArray(response?.products)) {
        products = response.products;
      } else if (Array.isArray(response?.results)) {
        products = response.results;
      }

      // Preserve pagination when supplied by the API.
      const pagination =
        data?.pagination ||
        data?.meta?.pagination ||
        response?.pagination ||
        {};

      dispatch(
        fetchProductsSuccess({
          products,
          pagination,
        }),
      );

      return {
        success: true,
        products,
        pagination,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch products";

      dispatch(fetchProductsFailure(message));

      return {
        success: false,
        message,
        products: [],
      };
    }
  };
