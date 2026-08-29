import { Link } from "react-router-dom";

const Footer = ({
  logo = "ShopSphere",
  description = "Your trusted destination for quality products at great prices.",
  className = "",
}) => {
  const shopLinks = [
    { label: "All Products", to: "/products" },
    { label: "Categories", to: "/categories" },
    { label: "Deals", to: "/deals" },
    { label: "New Arrivals", to: "/products?sort=newest" },
  ];

  const accountLinks = [
    { label: "My Account", to: "/profile" },
    { label: "My Orders", to: "/orders" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Cart", to: "/cart" },
  ];

  const supportLinks = [
    { label: "Help & Support", to: "/support" },
    { label: "Contact Us", to: "/contact" },
    { label: "Shipping Policy", to: "/shipping-policy" },
    { label: "Return Policy", to: "/return-policy" },
  ];

  return (
    <footer
      className={`border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              to="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {logo}
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />

          <FooterColumn title="Account" links={accountLinks} />

          <FooterColumn title="Support" links={supportLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {logo}. All rights reserved.
          </p>

          <div className="flex gap-4 text-sm">
            <Link
              to="/privacy-policy"
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({ title, links }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-gray-600 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Footer;
