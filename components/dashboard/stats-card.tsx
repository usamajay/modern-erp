import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string;
    subtext?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
}

export function StatsCard({ title, value, subtext, icon: Icon, trend }: StatsCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtext && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {subtext}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
