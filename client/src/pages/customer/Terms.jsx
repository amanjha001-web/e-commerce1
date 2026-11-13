const Terms = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill text-xs">Agreement</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl dark:text-foreground">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-xs text-[var(--muted)]">Effective Date: November 2026</p>
      </div>

      <div className="mt-12 space-y-8 rounded-2xl border border-[var(--line)] bg-white p-8 shadow-xs text-xs leading-relaxed text-[var(--text)] sm:p-10 dark:bg-card dark:text-foreground">
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">1. Acceptance of Terms</h2>
          <p className="mt-2 text-[var(--muted)]">
            By accessing or using the ShopSphere platform, services, or marketplace, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please discontinue using the service immediately.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">2. User Accounts & Responsibilities</h2>
          <p className="mt-2 text-[var(--muted)]">
            You are responsible for maintaining the confidentiality of your account credentials, password, and for restricting access to your computer or mobile device. You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">3. Marketplace & Vendor Obligations</h2>
          <p className="mt-2 text-[var(--muted)]">
            Vendors operating stores on ShopSphere represent and warrant that their products are authentic, legally permitted for sale, accurately described, and compliant with all applicable consumer safety standards and intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">4. Pricing & Payment</h2>
          <p className="mt-2 text-[var(--muted)]">
            Prices displayed across products are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless specified otherwise. We reserve the right to correct pricing errors or cancel orders resulting from inadvertent typographical inaccuracies.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">5. Returns, Cancellations & Refunds</h2>
          <p className="mt-2 text-[var(--muted)]">
            Eligible products may be returned within 7 days of delivery subject to our Shipping and Returns policy. Refunds for approved returns and cancellations are processed back to the original payment method within 5-7 business days.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">6. Limitation of Liability</h2>
          <p className="mt-2 text-[var(--muted)]">
            To the maximum extent permitted by law, ShopSphere shall not be liable for any indirect, incidental, punitive, or consequential damages arising out of or related to the use of or inability to use the platform.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
