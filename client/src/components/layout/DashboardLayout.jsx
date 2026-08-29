import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

const DashboardLayout = ({ sidebarItems = [], title = "Dashboard" }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <Sidebar items={sidebarItems} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <DashboardHeader title={title} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
