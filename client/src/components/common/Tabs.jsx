import { useState } from "react";

const Tabs = ({
  tabs = [],
  activeTab,
  defaultTab,
  onChange,
  variant = "pills",
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
    pills: {
      container: "gap-2 pb-2",
      active:
        "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold",
      inactive:
        "bg-white border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--soft)] font-semibold",
    },
    underline: {
      container: "border-b border-[var(--line)] gap-6",
      active:
        "border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold pb-2",
      inactive:
        "text-[var(--muted)] hover:text-[var(--primary)] font-medium pb-2",
    },
    boxed: {
      container: "gap-2",
      active:
        "bg-[var(--primary)] text-white border-[var(--primary)] font-bold",
      inactive:
        "bg-white border-[var(--line)] text-[var(--muted)] font-semibold",
    },
  };

  const selectedVariant = variants[variant] || variants.pills;
  const selectedTab = tabs.find((tab) => tab.value === currentTab);

  return (
    <div className={className}>
      <div className={`flex flex-wrap items-center overflow-x-auto ${selectedVariant.container}`}>
        {tabs.map((tab) => {
          const isActive = tab.value === currentTab;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleChange(tab.value)}
              className={`rounded-xl border px-3.5 py-2 text-xs transition-all duration-200 cursor-pointer ${
                isActive ? selectedVariant.active : selectedVariant.inactive
              } ${fullWidth ? "flex-1 text-center" : ""}`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-[var(--soft)] text-[var(--primary)]"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedTab?.content && <div className="mt-4">{selectedTab.content}</div>}
    </div>
  );
};

export default Tabs;
