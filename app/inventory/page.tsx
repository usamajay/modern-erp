"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Factory, TrendingDown, Users } from "lucide-react";

export default function InventoryPage() {
    const [loading, setLoading] = useState(true);
    const [stock, setStock] = useState<any>(null);

    useEffect(() => {
        async function fetchStock() {
            try {
                const res = await fetch("/api/inventory/stock");
                if (res.ok) {
                    setStock(await res.json());
                }
            } catch (e) {
                console.error("Failed to load stock", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStock();
    }, []);

    const formatKg = (val: number) => {
        if (!val) return "0 kg";
        return new Intl.NumberFormat().format(val) + " kg";
    };

    return (
        <div className="flex h-screen bg-muted/40 text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-6xl">
                        <h1 className="text-3xl font-bold tracking-tight mb-6">Inventory Overview</h1>

                        {loading ? (
                            <div className="text-muted-foreground">Loading stock levels...</div>
                        ) : (
                            <div className="space-y-8">
                                {/* Raw Material Section */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 flex items-center text-primary">
                                        <Truck className="mr-2 h-5 w-5" /> Raw Material (Paddy)
                                    </h2>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Paddy Stock</CardTitle>
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{formatKg(stock?.raw_material?.paddy)}</div>
                                                <p className="text-xs text-muted-foreground">Available for milling</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Finished Goods Section */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 flex items-center text-primary">
                                        <Factory className="mr-2 h-5 w-5" /> Finished Goods (Rice)
                                    </h2>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Head Rice</CardTitle>
                                                <Package className="h-4 w-4 text-emerald-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{formatKg(stock?.finished_goods?.head_rice)}</div>
                                                <p className="text-xs text-muted-foreground">Premium Quality</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Broken Rice</CardTitle>
                                                <Package className="h-4 w-4 text-yellow-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{formatKg(stock?.finished_goods?.broken_rice)}</div>
                                                <p className="text-xs text-muted-foreground">Secondary Grade</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Bran (Chilka)</CardTitle>
                                                <Package className="h-4 w-4 text-amber-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{formatKg(stock?.finished_goods?.bran)}</div>
                                                <p className="text-xs text-muted-foreground">By-product</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Husk</CardTitle>
                                                <Package className="h-4 w-4 text-gray-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{formatKg(stock?.finished_goods?.husk)}</div>
                                                <p className="text-xs text-muted-foreground">Fuel / Waste</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
