import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen bg-muted/40 text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              {/* DatePicker Could go here */}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value="$45,231.89"
              subtext="+20.1% from last month"
              icon={DollarSign}
            />
            <StatsCard
              title="Subscriptions"
              value="+2350"
              subtext="+180.1% from last month"
              icon={Users}
            />
            <StatsCard
              title="Sales"
              value="+12,234"
              subtext="+19% from last month"
              icon={CreditCard}
            />
            <StatsCard
              title="Active Now"
              value="+573"
              subtext="+201 since last hour"
              icon={Activity}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded border border-dashed text-muted-foreground">
                  Chart Area (Recharts will be implemented here)
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <p className="text-sm text-muted-foreground">
                  You made 265 sales this month.
                </p>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

