
import { Outlet } from "react-router-dom";

import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Fixed Header */}
      <header className="fixed inset-x-0 top-0 z-50 h-16">
        <AdminHeader />
      </header>

      {/* Sidebar starts below header */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="min-h-screen min-w-0 px-4 pb-6 pt-20 md:px-6 lg:ml-[272px]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
