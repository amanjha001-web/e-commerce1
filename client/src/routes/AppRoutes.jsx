import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AuthRoutes from "./AuthRoutes";
import CustomerRoutes from "./CustomerRoutes";
import VendorRoutes from "./VendorRoutes";
import AdminRoutes from "./AdminRoutes";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login/*" element={<AuthRoutes />} />

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
