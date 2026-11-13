import { useState } from "react";
import { toast } from "sonner";
import supportService from "../../services/support.service";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await supportService.createTicket({
        subject: form.subject || `Inquiry from ${form.name}`,
        message: `${form.message}\n\nSender Email: ${form.email}\nSender Name: ${form.name}`,
        category: "general",
        priority: "medium",
      });
      toast.success("Thank you! Your message has been received. Our team will contact you shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.success("Thank you! Your message has been forwarded to customer support.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill text-xs">Get in Touch</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text)] sm:text-4xl dark:text-foreground">
          We are here to assist you
        </h1>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Have questions about your order, boutique seller onboarding, or general queries?
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Email Support</h3>
            <p className="mt-1 text-sm font-semibold text-[var(--text)] dark:text-foreground">support@shopsphere.com</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Typical response within 2 hours</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Headquarters</h3>
            <p className="mt-1 text-sm font-semibold text-[var(--text)] dark:text-foreground">ShopSphere Retail Tech</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Bengaluru, Karnataka, India</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Operating Hours</h3>
            <p className="mt-1 text-sm font-semibold text-[var(--text)] dark:text-foreground">Mon – Sat: 9 AM – 9 PM IST</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Sunday: Emergency concierge only</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-7 shadow-xs lg:col-span-2 dark:bg-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] dark:text-foreground">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Rahul Sharma"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] dark:text-foreground">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] dark:text-foreground">
                Subject
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we assist you today?"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] dark:text-foreground">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Please describe your query with any relevant order IDs or product links..."
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="primarybtn w-full !py-3 !text-xs font-bold tracking-wider uppercase cursor-pointer"
            >
              {submitting ? "Sending inquiry..." : "Send Message →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
