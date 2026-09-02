import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Headphones,
  Settings,
  ShieldCheck,
  FolderTree,
  Bell,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";

const MENU_ITEMS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    label: "Users",
    icon: Users,
    path: "/admin/users",
  },
  {
    label: "Vendors",
    icon: Store,
    children: [
      {
        label: "All Vendors",
        path: "/admin/vendors",
      },
      {
        label: "Vendor Requests",
        path: "/admin/vendor-requests",
      },
    ],
  },
  {
    label: "Products",
    icon: Package,
    path: "/admin/products",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    path: "/admin/orders",
  },
  {
    label: "Payments",
    icon: CreditCard,
    path: "/admin/payments",
  },
  {
    label: "Catalog",
    icon: FolderTree,
    children: [
      {
        label: "Categories",
        path: "/admin/categories",
      },
      {
        label: "Brands",
        path: "/admin/brands",
      },
      {
        label: "Banners",
        path: "/admin/banners",
      },
      {
        label: "Coupons",
        path: "/admin/coupons",
      },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    path: "/admin/reports",
  },
  {
    label: "Support",
    icon: Headphones,
    path: "/admin/support",
  },
  {
    label: "Notifications",
    icon: Bell,
    path: "/admin/notifications",
  },
  {
    label: "Permissions",
    icon: ShieldCheck,
    path: "/admin/permissions",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/admin/settings",
  },
];

const AdminSidebar = ({
  open = false,
  onClose,
  user = null,
  onNavigate,
  onLogout,
}) => {
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const handleNavigate = (path) => {
    if (!path) return;

    onNavigate?.(path);
    onClose?.();
  };

  const handleGroupToggle = (label) => {
    setOpenGroup((previous) => (previous === label ? null : label));
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const initials =
    user?.fullName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.username?.slice(0, 2).toUpperCase() ||
    "AD";

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col",
          "border-r border-border bg-background",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Logo / Header */}
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <button
            type="button"
            onClick={() => handleNavigate("/admin")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              S
            </div>

            <div className="text-left">
              <p className="text-lg font-bold leading-none">ShopSphere</p>

              <p className="mt-1 text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName || "Admin"}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.fullName || user?.username || "Administrator"}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {user?.email || "Admin Account"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          aria-label="Admin navigation"
        >
          <div className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const hasChildren =
                Array.isArray(item.children) && item.children.length > 0;
              const isOpen = openGroup === item.label;

              if (hasChildren) {
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => handleGroupToggle(item.label)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>

                      <ChevronDown
                        className={[
                          "h-4 w-4 transition-transform duration-200",
                          isOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>

                    {isOpen && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
                        {item.children.map((child) => (
                          <button
                            key={child.path}
                            type="button"
                            onClick={() => handleNavigate(child.path)}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
