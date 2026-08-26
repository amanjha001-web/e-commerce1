import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/customer/Home";
import Products from "../pages/customer/Products";
import ProductDetails from "../pages/customer/ProductDetails";
import Categories from "../pages/customer/Categories";

import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";

import Orders from "../pages/customer/Orders";
import OrderDetails from "../pages/customer/OrderDetails";

import Profile from "../pages/customer/Profile";
import Addresses from "../pages/customer/Addresses";

import Wishlist from "../pages/customer/Wishlist";
import Reviews from "../pages/customer/Reviews";

import Notifications from "../pages/customer/Notifications";
import Chat from "../pages/customer/Chat";
import Support from "../pages/customer/Support";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Customer Pages */}

        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />

        <Route path="/products/:productId" element={<ProductDetails />} />

        <Route path="/categories" element={<Categories />} />

        {/* Protected Customer Pages */}

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />

          <Route path="/checkout" element={<Checkout />} />

          <Route path="/orders" element={<Orders />} />

          <Route path="/orders/:orderId" element={<OrderDetails />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/addresses" element={<Addresses />} />

          <Route path="/wishlist" element={<Wishlist />} />

          <Route path="/reviews" element={<Reviews />} />

          <Route path="/notifications" element={<Notifications />} />

          <Route path="/chat" element={<Chat />} />

          <Route path="/support" element={<Support />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default CustomerRoutes;
