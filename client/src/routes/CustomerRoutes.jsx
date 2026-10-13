
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

// Public Customer Pages
const Home = lazy(() => import("../pages/customer/Home"));
const Products = lazy(() => import("../pages/customer/Products"));
const ProductDetails = lazy(
  () => import("../pages/customer/ProductDetails")
);
const Categories = lazy(() => import("../pages/customer/Categories"));

// Protected Customer Pages
const Cart = lazy(() => import("../pages/customer/Cart"));
const Checkout = lazy(() => import("../pages/customer/Checkout"));

const Orders = lazy(() => import("../pages/customer/Orders"));
const OrderDetails = lazy(
  () => import("../pages/customer/OrderDetails")
);

import BecomeSeller from "../pages/customer/BecomeSeller";
import SellerRequestStatus from "../pages/customer/SellerRequestStatus";

const Profile = lazy(() => import("../pages/customer/Profile"));
const Addresses = lazy(() => import("../pages/customer/Addresses"));

const Wishlist = lazy(() => import("../pages/customer/Wishlist"));
const Reviews = lazy(() => import("../pages/customer/Reviews"));

const Notifications = lazy(
  () => import("../pages/customer/Notifications")
);
const Chat = lazy(() => import("../pages/customer/Chat"));
const Support = lazy(() => import("../pages/customer/Support"));

// Loading UI
const PageLoader = () => {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
          role="status"
          aria-label="Loading"
        />

        <p className="text-sm text-gray-500">
          Loading page...
        </p>
      </div>
    </div>
  );
};

const CustomerRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Customer Pages */}

          <Route path="/" element={<Home />} />

          <Route path="/products" element={<Products />} />

          <Route path="/products/:productId" element={<ProductDetails />} />

          <Route path="/categories" element={<Categories />} />

          {/* Protected Customer Pages */}

          <Route
  element={<ProtectedRoute allowedRoles={["customer"]} />}
>
            <Route path="/become-seller" element={<BecomeSeller />} />

            <Route
              path="/seller/request-status"
              element={<SellerRequestStatus />}
            />
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
    </Suspense>
  );
};

export default CustomerRoutes;
