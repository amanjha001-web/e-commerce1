
import { useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import EarningsCard from "../../components/vendor/EarningsCard";
import SalesChart from "../../components/vendor/SalesChart";
import PayoutTable from "../../components/vendor/PayoutTable";

import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import formatCurrency from "../../utils/formatCurrency";

const Earnings = ({
  user = null,
  earnings = {},
  salesData = [],
  payouts = [],
  loading = false,
  notificationCount = 0,

  onViewPayout,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("30d");

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const totalEarnings =
    earnings?.totalEarnings ??
    earnings?.total ??
    0;

  const availableBalance =
    earnings?.availableBalance ??
    earnings?.available ??
    0;

  const pendingBalance =
    earnings?.pendingBalance ??
    earnings?.pending ??
    0;

  const withdrawnAmount =
    earnings?.withdrawnAmount ??
    earnings?.withdrawn ??
    0;

  const commission =
    earnings?.commission ??
    earnings?.platformFee ??
    0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <VendorSidebar
        activeItem="earnings"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        <VendorHeader
          title="Earnings"
          subtitle="Track your store revenue and payouts"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={onLogout}
          onProfileClick={() =>
            handleNavigate("profile")
          }
          onNotificationsClick={() =>
            handleNavigate("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Earnings Overview
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor your earnings, balance and payout history.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  handleNavigate("payouts")
                }
              >
                View Payouts
              </Button>
            </div>

            {/* Earnings Summary */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <EarningsCard
                title="Total Earnings"
                value={formatCurrency(totalEarnings)}
                change={earnings?.totalChange}
              />

              <EarningsCard
                title="Available Balance"
                value={formatCurrency(availableBalance)}
              />

              <EarningsCard
                title="Pending Balance"
                value={formatCurrency(pendingBalance)}
              />

              <EarningsCard
                title="Withdrawn"
                value={formatCurrency(withdrawnAmount)}
              />
            </div>

            {/* Revenue / Commission */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Gross Revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {formatCurrency(
                    earnings?.grossRevenue ??
                      totalEarnings + commission
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Revenue generated before platform fees.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Platform Commission
                </p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {formatCurrency(commission)}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Fees deducted from your store revenue.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Net Earnings
                </p>

                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatCurrency(
                    earnings?.netEarnings ??
                      totalEarnings
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Your earnings after applicable fees.
                </p>
              </div>
            </div>

            {/* Sales Chart */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Earnings Trend
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    View your revenue performance over time.
                  </p>
                </div>

                <div className="w-full sm:w-40">
                  <Select
                    value={period}
                    onChange={(event) =>
                      setPeriod(
                        event.target.value
                      )
                    }
                    options={[
                      {
                        label: "Last 7 Days",
                        value: "7d",
                      },
                      {
                        label: "Last 30 Days",
                        value: "30d",
                      },
                      {
                        label: "Last 90 Days",
                        value: "90d",
                      },
                    ]}
                  />
                </div>
              </div>

              {salesData.length > 0 ? (
                <SalesChart
                  data={salesData}
                  period={period}
                />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center">
                  <EmptyState
                    title="No earnings data"
                    description="There is no earnings activity for the selected period."
                  />
                </div>
              )}
            </section>

            {/* Payout History */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Recent Payouts
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Review your latest payout transactions.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    handleNavigate("payouts")
                  }
                >
                  All Payouts
                </Button>
              </div>

              {payouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <PayoutTable
                    payouts={payouts}
                    onViewPayout={onViewPayout}
                  />
                </div>
              ) : (
                <div className="p-8">
                  <EmptyState
                    title="No payouts yet"
                    description="Your payout history will appear here once you receive a payout."
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Earnings;