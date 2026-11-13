import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import VendorRoutes from "./VendorRoutes";
import AdminRoutes from "./AdminRoutes";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Direct shortcuts to Auth */}
        <Route path="/register" element={<Navigate to="/login/register" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/login/forgot-password" replace />} />
        <Route path="/reset-password" element={<Navigate to="/login/reset-password" replace />} />
        <Route path="/verify-email" element={<Navigate to="/login/verify-email" replace />} />
        <Route path="/verify-otp" element={<Navigate to="/login/verify-otp" replace />} />

        {/* Auth */}
        <Route path="/login/*" element={<AuthRoutes />} />
        <Route path="/auth/*" element={<AuthRoutes />} />

        {/* Vendor */}
        <Route path="/vendor/*" element={<VendorRoutes />} />

        {/* Admin */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Customer */}
        <Route path="/*" element={<CustomerRoutes />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
