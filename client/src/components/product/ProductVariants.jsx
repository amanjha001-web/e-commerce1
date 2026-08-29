
import { useMemo } from "react";

const ProductVariants = ({
  variants = [],
  selectedVariants = {},
  onChange,
  disabled = false,
}) => {
  const variantGroups = useMemo(() => {
    const groups = {};

    variants.forEach((variant) => {
      if (!variant) return;

      // Supported formats:
      // { name: "Color", value: "Red" }
      // { attribute: "Color", value: "Red" }
      // { type: "Color", value: "Red" }
      // { option: "Color", optionValue: "Red" }

      const groupName =
        variant.name ||
        variant.attribute ||
        variant.type ||
        variant.option;

      const value =
        variant.value ||
        variant.label ||
        variant.optionValue;

      if (!groupName || value == null) {
        return;
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      const exists = groups[groupName].some(
        (item) => item.value === value,
      );

      if (!exists) {
        groups[groupName].push({
          ...variant,
          value,
        });
      }
    });

    return groups;
  }, [variants]);

  const selected = selectedVariants || {};

  const handleChange = (groupName, value) => {
    if (disabled) return;

    const nextSelected = {
      ...selected,
      [groupName]: value,
    };

    onChange?.(nextSelected, groupName, value);
  };

  if (!Object.keys(variantGroups).length) {
    return null;
  }

  return (
    <div className="space-y-5">
      {Object.entries(variantGroups).map(
        ([groupName, options]) => {
          const currentValue = selected[groupName];

          return (
            <div key={groupName}>
              {/* Group Header */}
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {groupName}
                </h3>

                {currentValue && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentValue}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-2">
                {options.map((option, index) => {
                  const value = option.value;

                  const isSelected =
                    currentValue === value;

                  const isDisabled =
                    disabled ||
                    option.disabled === true ||
                    option.available === false ||
                    option.inStock === false;

                  const color =
                    option.color || option.hex;

                  return (
                    <button
                      key={`${groupName}-${value}-${index}`}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        handleChange(groupName, value)
                      }
                      title={String(value)}
                      aria-pressed={isSelected}
                      className={`relative min-w-12 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      } ${
                        isDisabled
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer"
                      }`}
                    >
                      {color ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: color,
                            }}
                          />

                          <span>{value}</span>
                        </span>
                      ) : (
                        value
                      )}

                      {option.stock != null && (
                        <span className="ml-1 text-[10px] text-gray-400">
                          ({option.stock})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        },
      )}
    </div>
  );
};

export default ProductVariants;
