import { Link } from "react-router-dom";

const Footer = ({
  className = "",
}) => {
  return (
    <footer className={`mt-16 bg-[#2a101a] text-[#f9eaf0] ${className}`}>
      <div className="mx-auto max-w-[1440px] px-4 py-11 sm:px-7">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="text-2xl font-black tracking-tight text-white"
            >
              Shop<span className="text-[var(--gold)]">Sphere</span>.
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#d9c4cc]">
              A thoughtful shopping experience for everyday essentials and timeless finds. Curated quality, secure payments, and fast shipping.
            </p>

            <p className="mt-6 text-xs text-[#a8909b]">
              © {new Date().getFullYear()} ShopSphere. All rights reserved.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-[#d9c4cc]">
              <li>
                <Link to="/products" className="transition hover:text-white hover:underline">
                  Shop all products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="transition hover:text-white hover:underline">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/products?deals=true" className="transition hover:text-white hover:underline">
                  Special offers
                </Link>
              </li>
              <li>
                <Link to="/become-seller" className="transition hover:text-white hover:underline">
                  Sell on ShopSphere
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">
              Customer care
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-[#d9c4cc]">
              <li>
                <Link to="/support" className="transition hover:text-white hover:underline">
                  Help & Support
                </Link>
              </li>
              <li>
                <Link to="/orders" className="transition hover:text-white hover:underline">
                  Track order
                </Link>
              </li>
              <li>
                <Link to="/support?tab=returns" className="transition hover:text-white hover:underline">
                  Returns & refunds
                </Link>
              </li>
              <li>
                <Link to="/chat" className="transition hover:text-white hover:underline">
                  Live chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Your Account */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">
              Your account
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-[#d9c4cc]">
              <li>
                <Link to="/profile" className="transition hover:text-white hover:underline">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="transition hover:text-white hover:underline">
                  Saved wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="transition hover:text-white hover:underline">
                  Shopping bag
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-white hover:underline">
                  Sign in / Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#462030] pt-6 sm:flex-row text-xs text-[#a8909b]">
          <p>Designed with Burgundy Luxury theme.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            <Link to="/admin" className="text-[var(--gold)] hover:underline">Admin Console</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
