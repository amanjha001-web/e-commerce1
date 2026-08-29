import { Link, Outlet } from "react-router-dom";

const AuthLayout = ({
  logo = "ShopSphere",
  title = "Welcome to ShopSphere",
  description = "Securely access your account and continue shopping.",
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Section */}
        <div className="hidden flex-col justify-between bg-blue-600 p-8 text-white lg:flex xl:p-12">
          <Link to="/" className="text-2xl font-bold">
            {logo}
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              {title}
            </h1>

            <p className="mt-4 text-base leading-7 text-blue-100">
              {description}
            </p>
          </div>

          <p className="text-sm text-blue-100">
            © {new Date().getFullYear()} {logo}. All rights reserved.
          </p>
        </div>

        {/* Right Section */}
        <div className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
            <Link
              to="/"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {logo}
            </Link>

            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Home
            </Link>
          </div>

          <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
