import { FaTruck, FaUndo, FaShieldAlt, FaClock } from "react-icons/fa";

const ShippingPolicy = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill text-xs">Delivery & Returns</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl dark:text-foreground">
          Shipping & Returns Policy
        </h1>
        <p className="mt-2 text-xs text-[var(--muted)]">Transparent, dependable delivery across India</p>
      </div>

      {/* Highlights Grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: FaTruck,
            title: "Standard 3-5 Days",
            desc: "Fast dispatch from nearest fulfillment partner."
          },
          {
            icon: FaClock,
            title: "24h Order Processing",
            desc: "Orders verified and packed within 24 hours."
          },
          {
            icon: FaUndo,
            title: "7-Day Return Window",
            desc: "Hassle-free return request on eligible goods."
          },
          {
            icon: FaShieldAlt,
            title: "Insured Transit",
            desc: "100% damage protection during delivery."
          }
        ].map((item, i) => (
          <div key={i} className="rounded-2xl border border-[var(--line)] bg-white p-5 text-center shadow-xs dark:bg-card">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-xs font-black text-[var(--text)] dark:text-foreground">{item.title}</h3>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-8 rounded-2xl border border-[var(--line)] bg-white p-8 shadow-xs text-xs leading-relaxed text-[var(--text)] sm:p-10 dark:bg-card dark:text-foreground">
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">1. Shipping Coverage & Timelines</h2>
          <p className="mt-2 text-[var(--muted)]">
            We deliver to over 19,000 postal pin codes across India. Standard orders are packed and dispatched within 24-48 business hours. Expected transit time ranges between 3 to 7 working days depending on geographic region and logistical access.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">2. Shipping Charges</h2>
          <p className="mt-2 text-[var(--muted)]">
            Standard delivery is complimentary on all prepaid orders exceeding ₹999. Orders below ₹999 or Cash on Delivery (COD) orders incur a nominal delivery fee calculated dynamically at checkout based on package weight and destination tier.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">3. Real-Time Tracking</h2>
          <p className="mt-2 text-[var(--muted)]">
            As soon as your shipment is picked up by our logistics courier, an active AWB tracking number along with live tracking status is emailed and made accessible directly under your account orders dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">4. Return & Replacement Process</h2>
          <p className="mt-2 text-[var(--muted)]">
            If you receive a defective, damaged, or incorrect item, you can initiate a return or replacement request directly from the Order Details page within 7 calendar days of receipt. Our pickup courier will collect the package from your address once approved.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">5. Refund Timeline</h2>
          <p className="mt-2 text-[var(--muted)]">
            Refunds are initiated immediately upon successful physical quality verification at the vendor hub. Net banking, UPI, and card refunds credit within 5-7 banking days. COD refunds are credited via NEFT or ShopSphere Store Wallet credits.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
