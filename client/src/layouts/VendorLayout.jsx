import { Outlet } from "react-router-dom";

import VendorHeader from "../components/vendor/VendorHeader";
import VendorSidebar from "../components/vendor/VendorSidebar";

const VendorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <VendorHeader />

      <div className="flex">
        <VendorSidebar />

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
