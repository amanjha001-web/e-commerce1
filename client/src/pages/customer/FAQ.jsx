import { useState } from "react";
import { Link } from "react-router-dom";

const FAQS = [
  {
    q: "How do I track my order status?",
    a: "You can track your order at any moment by navigating to 'My Orders' in your account. You will find real-time delivery timelines, shipping partner tracking numbers, and stage-by-stage status updates.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Net Banking, Major Debit & Credit Cards (Visa, MasterCard, RuPay), and EMI options through secure Razorpay payment gateways.",
  },
  {
    q: "What is your return and refund policy?",
    a: "Most items qualify for a 7-day hassle-free return window upon delivery. Once your return request is approved and the item is inspected, refunds are credited back to your original payment method or wallet within 3–5 business days.",
  },
  {
    q: "How can I become a verified seller / vendor on ShopSphere?",
    a: "Simply click 'Become a Seller' in the navigation or footer. Complete our straightforward store registration with your business and bank details. Once approved by our team, you can manage products, inventory, orders, and payouts directly through the Seller Centre.",
  },
  {
    q: "Are the products on ShopSphere authentic?",
    a: "Yes, 100%. All products listed on ShopSphere are sourced directly from verified manufacturers, authorized brand distributors, and vetted boutique artisans.",
  },
  {
    q: "How do I contact customer support?",
    a: "You can open a support ticket under 'Help & Support' in your profile, chat with our live concierge, or reach us via email at support@shopsphere.com.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill text-xs">Help & Knowledge Base</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl dark:text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Find answers to common questions about orders, payments, shipping, and seller onboarding.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition shadow-xs dark:bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between p-6 text-left text-sm font-bold text-[var(--text)] transition hover:text-[var(--primary)] dark:text-foreground cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="ml-4 text-base font-bold text-[var(--primary)]">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-[var(--line)] bg-[var(--soft)]/30 px-6 py-5 text-xs leading-relaxed text-[var(--muted)]">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-xs dark:bg-card">
        <h3 className="text-base font-bold text-[var(--text)] dark:text-foreground">Still have questions?</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Our friendly support team is ready to help you 24/7.
        </p>
        <div className="mt-5 flex justify-center gap-4">
          <Link to="/contact" className="primarybtn !py-2.5 !px-5 !text-xs">
            Contact Support
          </Link>
          <Link to="/support" className="outlinebtn !py-2.5 !px-5 !text-xs">
            Support Desk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
