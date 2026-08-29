import { useState } from "react";
import { Outlet } from "react-router-dom";

import TopBar from "./TopBar";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";
import Footer from "./Footer";

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <TopBar />

      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />

      <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
