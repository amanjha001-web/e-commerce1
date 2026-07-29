import Logo from "./navbar/Logo";
import NavLinks from "./navbar/NavLinks";
import SearchBar from "./navbar/SearchBar";
import NavActions from "./navbar/NavActions";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Logo />

        <NavLinks />

        <div className="flex items-center gap-6">
          <SearchBar />
          <NavActions />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
