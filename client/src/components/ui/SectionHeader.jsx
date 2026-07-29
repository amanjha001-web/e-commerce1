const SectionHeader = ({ title, subtitle, buttonText, onButtonClick }) => {
  return (
    <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div>
        <h2 className="text-4xl font-bold text-gray-900">{title}</h2>

        <p className="mt-2 text-gray-500">{subtitle}</p>
      </div>

      {buttonText && (
        <button
          onClick={onButtonClick}
          className="rounded-xl border border-indigo-600 px-6 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-600 hover:text-white"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
