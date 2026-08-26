import { Outlet } from "react-router-dom";

import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <AdminHeader />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
