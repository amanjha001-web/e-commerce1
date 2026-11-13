const PrivacyPolicy = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill text-xs">Legal & Transparency</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl dark:text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-[var(--muted)]">Last updated: November 2026</p>
      </div>

      <div className="mt-12 space-y-8 rounded-2xl border border-[var(--line)] bg-white p-8 shadow-xs text-xs leading-relaxed text-[var(--text)] sm:p-10 dark:bg-card dark:text-foreground">
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">1. Information We Collect</h2>
          <p className="mt-2 text-[var(--muted)]">
            We collect personal identification details such as your name, email address, shipping address, contact phone number, and payment transaction metadata when you create an account, place an order, or interact with customer care.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">2. How We Use Your Data</h2>
          <p className="mt-2 text-[var(--muted)]">
            Your data is used strictly to fulfill orders, facilitate deliveries through certified logistics partners, process secure payment transactions, prevent fraudulent activities, and provide timely order tracking updates.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">3. Data Security & Storage</h2>
          <p className="mt-2 text-[var(--muted)]">
            All user credentials and sensitive information are encrypted using industry-standard protocols including bcrypt password hashing, JWT stateless access tokens, and TLS 1.3 transport security. We never store raw payment card data on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">4. Third-Party Sharing</h2>
          <p className="mt-2 text-[var(--muted)]">
            We share required fulfillment details only with certified partners necessary to process your transaction (such as Razorpay for payment processing and registered couriers for parcel delivery). We never sell or lease your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--primary)]">5. Your Privacy Rights</h2>
          <p className="mt-2 text-[var(--muted)]">
            You retain full rights to inspect, update, export, or permanently delete your account and personal data at any time through your Profile settings or by contacting privacy@shopsphere.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
