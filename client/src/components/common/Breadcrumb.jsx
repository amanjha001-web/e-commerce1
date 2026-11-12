import { Link } from "react-router-dom";

const Breadcrumb = ({ items = [], separator = "/", className = "" }) => {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`mb-3.5 ${className}`}>
      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--muted)]">
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
                      className="transition hover:text-[var(--primary)] hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}

                  <span className="opacity-50" aria-hidden="true">
                    {separator}
                  </span>
                </>
              )}

              {isLast && (
                <span
                  className="font-bold text-[var(--text)] dark:text-foreground"
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
