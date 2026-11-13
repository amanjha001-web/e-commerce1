import { Link } from "react-router-dom";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const About = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center">
        <span className="pill text-xs">Our Heritage & Story</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text)] sm:text-5xl dark:text-foreground">
          Elevating E-Commerce with <span className="text-[var(--primary)]">Curated Luxury</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          ShopSphere was founded on a simple philosophy: everyday shopping should feel extraordinary.
          From hand-selected artisanal vendors to verified global brands, we bridge authentic craftsmanship with modern convenience.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-7 shadow-xs dark:bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--soft)] text-xl text-[var(--primary)] font-bold">
            01
          </div>
          <h3 className="mt-5 text-lg font-bold text-[var(--text)] dark:text-foreground">Verified Artisans</h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Every seller undergoes our multi-step audit for product quality, ethical manufacturing, and customer service dedication.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-7 shadow-xs dark:bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--soft)] text-xl text-[var(--primary)] font-bold">
            02
          </div>
          <h3 className="mt-5 text-lg font-bold text-[var(--text)] dark:text-foreground">Seamless Security</h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Encrypted payment rails powered by industry leaders. Complete buyer protection and guaranteed return transparency.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-7 shadow-xs dark:bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--soft)] text-xl text-[var(--primary)] font-bold">
            03
          </div>
          <h3 className="mt-5 text-lg font-bold text-[var(--text)] dark:text-foreground">Customer First</h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Round-the-clock live chat, effortless order tracking, and a concierge support team ready to assist with any request.
          </p>
        </div>
      </div>

      {/* Mission Banner */}
      <div className="mt-16 rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[#881337] to-[#4C0519] p-8 text-white sm:p-12 shadow-lg">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
            Join the ShopSphere Community
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#f9eaf0]">
            Whether you are exploring curated essentials or scaling your boutique business as a seller, ShopSphere provides the platform you deserve.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/products"
              className="rounded-xl bg-[var(--gold)] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#a37930]"
            >
              Explore Catalog →
            </Link>
            <Link
              to="/become-seller"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-xs font-bold text-white transition hover:bg-white/20"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
