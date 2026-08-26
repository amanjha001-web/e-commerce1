import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
