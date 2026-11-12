import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground transition-colors duration-300">
      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
