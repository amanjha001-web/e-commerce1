
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
      { label: "All Vendors", path: "/admin/vendors" },
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
      { label: "Categories", path: "/admin/categories" },
      { label: "Brands", path: "/admin/brands" },
      { label: "Banners", path: "/admin/banners" },
      { label: "Coupons", path: "/admin/coupons" },
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
  const navigate = useNavigate();
  const location = useLocation();

  // undefined means: use the currently active group by default.
  // null means: the user explicitly closed all groups.
  const [openGroup, setOpenGroup] = useState(undefined);

  const currentPath = location.pathname;

  const isPathActive = (path) => {
    if (!path) return false;

    if (path === "/admin") {
      return (
        currentPath === "/admin" ||
        currentPath === "/admin/"
      );
    }

    return (
      currentPath === path ||
      currentPath.startsWith(`${path}/`)
    );
  };

  const activeGroup = MENU_ITEMS.find((item) =>
    item.children?.some((child) =>
      isPathActive(child.path)
    )
  )?.label;

  const displayedOpenGroup =
    openGroup === undefined ? activeGroup : openGroup;

  // Close sidebar on Escape; no state updates inside the effect.
  useEffect(() => {
    if (!open) return undefined;

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

    if (location.pathname !== path) {
      navigate(path);
    }

    onNavigate?.(path);
    onClose?.();
  };

  const handleGroupToggle = (label) => {
    setOpenGroup((previous) => {
      const current = previous === undefined
        ? activeGroup
        : previous;

      return current === label ? null : label;
    });
  };

  const fullName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Administrator";

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <>
      {/* Mobile overlay: starts below the navbar */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed bottom-0 left-0 top-16 z-40",
          "flex w-[272px] flex-col",
          "border-r border-slate-200/80 bg-white",
          "shadow-sm transition-transform duration-300 ease-in-out",
          "dark:border-slate-800 dark:bg-slate-950",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleNavigate("/admin")}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Open admin dashboard"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-extrabold text-white shadow-md shadow-blue-600/20">
              S
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
                ShopSphere
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                Administration
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Profile */}
        <div className="shrink-0 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900">
            {user?.avatar || user?.profileImage ? (
              <img
                src={user.avatar || user.profileImage}
                alt={fullName}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {fullName}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email || "Admin Account"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Admin navigation"
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
        >
          <p className="mb-2 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children?.length);

              const groupIsActive = item.children?.some(
                (child) => isPathActive(child.path)
              );

              const isOpen =
                displayedOpenGroup === item.label;

              if (hasChildren) {
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        handleGroupToggle(item.label)
                      }
                      className={[
                        "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                        groupIsActive
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={1.8}
                          className={
                            groupIsActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                          }
                        />
                        {item.label}
                      </span>

                      <ChevronDown
                        size={15}
                        className={[
                          "text-slate-400 transition-transform duration-200",
                          isOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>

                    {isOpen && (
                      <div className="ml-[21px] mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                        {item.children.map((child) => {
                          const active = isPathActive(child.path);

                          return (
                            <button
                              key={child.path}
                              type="button"
                              onClick={() =>
                                handleNavigate(child.path)
                              }
                              aria-current={
                                active ? "page" : undefined
                              }
                              className={[
                                "relative flex w-full items-center rounded-lg px-3 py-2 text-left text-[12px] transition-colors",
                                active
                                  ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
                              ].join(" ")}
                            >
                              {active && (
                                <span className="absolute -left-[16px] h-5 w-[2px] rounded-full bg-blue-600" />
                              )}
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isPathActive(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    }
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onLogout?.()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
