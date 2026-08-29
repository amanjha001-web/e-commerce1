import { Link } from "react-router-dom";

const Breadcrumb = ({ items = [], separator = "/", className = "" }) => {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {!isLast && (
                <>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="text-gray-500 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.label}
                    </span>
                  )}

                  <span className="text-gray-400" aria-hidden="true">
                    {separator}
                  </span>
                </>
              )}

              {isLast && (
                <span
                  className="font-medium text-gray-900 dark:text-white"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
