const CheckoutSteps = ({
  currentStep = 1,
  steps = ["Address", "Review", "Payment"],
  onStepClick,
}) => {
  const safeStep = Math.min(Math.max(currentStep, 1), steps.length);

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const stepNumber = index + 1;

          const isCompleted = stepNumber < safeStep;

          const isCurrent = stepNumber === safeStep;

          const canClick =
            stepNumber <= safeStep && typeof onStepClick === "function";

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!canClick}
                  onClick={() => onStepClick?.(stepNumber)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    isCompleted || isCurrent
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  } ${
                    canClick
                      ? "cursor-pointer hover:scale-105"
                      : "cursor-default"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </button>

                <span
                  className={`mt-2 text-xs font-semibold ${
                    isCurrent || isCompleted
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-3 mt-[-20px] h-0.5 flex-1 ${
                    stepNumber < safeStep
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Step {safeStep} of {steps.length}
          </span>

          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {steps[safeStep - 1]}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${(safeStep / steps.length) * 100}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between">
          {steps.map((step, index) => (
            <span
              key={step}
              className={`text-[10px] ${
                index + 1 <= safeStep
                  ? "font-semibold text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSteps;
