import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";
import MobileMenu from "../components/layout/MobileMenu";
import Footer from "../components/layout/Footer";

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <Navbar onMenuClick={openMobileMenu} />

      <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
