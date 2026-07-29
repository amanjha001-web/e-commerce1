import { NavLink } from "react-router-dom";

const links = [
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
  { name: "Categories", path: "/categories" },
  { name: "Vendors", path: "/vendors" },
  { name: "Deals", path: "/deals" },
];

const NavLinks = () => {
  return (
    <nav className="hidden items-center gap-8 lg:flex">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            `font-medium transition ${
              isActive
                ? "text-indigo-600"
                : "text-gray-700 hover:text-indigo-600"
            }`
          }
        >
          {link.name}
        </NavLink>
      ))}
    </nav>
  );
};

export default NavLinks;
