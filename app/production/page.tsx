"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ProductionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        batch_no: "",
        machine_no: "Husker-1",
        input_item: "Basmati Paddy",
        input_qty: "", // kgs
        input_bags: "",
        // Outputs
        output_head_rice: "",
        output_broken_rice: "",
        output_bran: "",
        output_husk: "",
        output_dirt: "",
        remarks: ""
    });

    // Calculations
    const totalInput = Number(formData.input_qty) || 0;
    const totalOutput =
        Number(formData.output_head_rice) +
        Number(formData.output_broken_rice) +
        Number(formData.output_bran) +
        Number(formData.output_husk) +
        Number(formData.output_dirt);

    const recoveryPercentage = totalInput > 0 ? ((totalOutput / totalInput) * 100).toFixed(2) : "0";
    const weightLoss = totalInput - totalOutput;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/production/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit");
            }

            const responseData = await res.json();
            alert(`Success! Batch ID: ${responseData.id}`);
            router.push("/");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error submitting form");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-muted/40 text-foreground overflow-hidden">
            <Sidebar />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold tracking-tight">Production / Milling</h1>
                            <div className="text-sm text-muted-foreground">
                                Record Daily Processing
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6">

                                {/* Input Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Input (Raw Material)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Internal Batch No</Label>
                                            <Input
                                                name="batch_no"
                                                placeholder="e.g. B-2023-001"
                                                value={formData.batch_no}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Input Item</Label>
                                            <Input
                                                name="input_item"
                                                value={formData.input_item}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Machine / Line</Label>
                                            <Input
                                                name="machine_no"
                                                value={formData.machine_no}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Input Quantity (kg)</Label>
                                            <Input
                                                type="number"
                                                name="input_qty"
                                                value={formData.input_qty}
                                                onChange={handleInputChange}
                                                required
                                                className="font-bold bg-muted/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Input Bags (Approx)</Label>
                                            <Input
                                                type="number"
                                                name="input_bags"
                                                value={formData.input_bags}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Output Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between">
                                            <span>Output / Yield</span>
                                            <span className={Number(recoveryPercentage) < 95 ? "text-red-500 text-sm" : "text-green-500 text-sm"}>
                                                Matching: {recoveryPercentage}%
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                                                <Label className="text-primary font-semibold">Head Rice (Super)</Label>
                                                <Input
                                                    type="number"
                                                    name="output_head_rice"
                                                    value={formData.output_head_rice}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Broken Rice (Tota)</Label>
                                                <Input
                                                    type="number"
                                                    name="output_broken_rice"
                                                    value={formData.output_broken_rice}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Rice Bran (Phak)</Label>
                                                <Input
                                                    type="number"
                                                    name="output_bran"
                                                    value={formData.output_bran}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Husk (Chilka)</Label>
                                                <Input
                                                    type="number"
                                                    name="output_husk"
                                                    value={formData.output_husk}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Dirt / Waste</Label>
                                                <Input
                                                    type="number"
                                                    name="output_dirt"
                                                    value={formData.output_dirt}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t">
                                            <div className="text-sm">
                                                <p>Total Input: <strong>{totalInput} kg</strong></p>
                                                <p>Total Output: <strong>{totalOutput} kg</strong></p>
                                            </div>
                                            <div className="text-right">
                                                <p className={weightLoss > 10 ? "text-destructive font-bold" : "text-muted-foreground"}>
                                                    System Loss: {weightLoss.toFixed(2)} kg
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() => router.push("/")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Production Batch
                                    </Button>
                                </div>

                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
