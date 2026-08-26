import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import VendorRoutes from "./VendorRoutes";
import AdminRoutes from "./AdminRoutes";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<CustomerRoutes />} />

        <Route path="/login/*" element={<AuthRoutes />} />

        <Route path="/register/*" element={<AuthRoutes />} />

        <Route path="/forgot-password/*" element={<AuthRoutes />} />

        <Route path="/reset-password/*" element={<AuthRoutes />} />

        <Route path="/verify-email/*" element={<AuthRoutes />} />

        <Route path="/verify-otp/*" element={<AuthRoutes />} />

        <Route path="/vendor/*" element={<VendorRoutes />} />

        <Route path="/admin/*" element={<AdminRoutes />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
