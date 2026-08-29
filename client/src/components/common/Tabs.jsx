import { useState } from "react";

const Tabs = ({
  tabs = [],
  activeTab,
  defaultTab,
  onChange,
  variant = "underline",
  fullWidth = false,
  className = "",
}) => {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.value);

  const currentTab = activeTab ?? internalTab;

  const handleChange = (value) => {
    if (activeTab === undefined) {
      setInternalTab(value);
    }

    onChange?.(value);
  };

  const variants = {
    underline: {
      container: "border-b border-gray-200 dark:border-gray-700",
      active:
        "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400",
      inactive:
        "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
    },

    pills: {
      container: "rounded-lg bg-gray-100 p-1 dark:bg-gray-800",
      active:
        "rounded-md bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white",
      inactive:
        "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
    },

    boxed: {
      container: "border-b border-gray-200 dark:border-gray-700",
      active:
        "border border-b-white bg-white text-blue-600 dark:border-gray-700 dark:border-b-gray-900 dark:bg-gray-900 dark:text-blue-400",
      inactive:
        "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
    },
  };

  const selectedVariant = variants[variant] || variants.underline;

  const selectedTab = tabs.find((tab) => tab.value === currentTab);

  return (
    <div className={className}>
      <div className={`flex overflow-x-auto ${selectedVariant.container}`}>
        {tabs.map((tab) => {
          const isActive = tab.value === currentTab;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => !tab.disabled && handleChange(tab.value)}
              disabled={tab.disabled}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                fullWidth ? "flex-1" : ""
              } ${
                isActive ? selectedVariant.active : selectedVariant.inactive
              }`}
              role="tab"
              aria-selected={isActive}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}

              {tab.label}

              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedTab?.content && (
        <div className="pt-4">{selectedTab.content}</div>
      )}
    </div>
  );
};

export default Tabs;
