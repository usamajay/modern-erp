"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
    id: number;
    name: string;
    legacy_pcode?: string;
}

export default function ProcurementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<Account[]>([]);

    // Combobox State
    const [open, setOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        gate_pass_no: "",
        vehicle_no: "",
        driver_name: "",
        item_name: "Basmati Paddy",
        bags: "",
        bag_type: "Jute",
        gross_weight: "0",
        tare_weight: "0",
        rate: "0",
        // Deductions
        deduction_bardana: "0",
        deduction_labor: "0",
        deduction_stiching: "0",
        deduction_munshyana: "0",
        deduction_sottri: "0",
        deduction_moisture: "0",
        remarks: ""
    });

    // Computed Values
    const netWeight = Math.max(0, Number(formData.gross_weight) - Number(formData.tare_weight));
    const amount = netWeight * Number(formData.rate);
    const totalDeductions =
        Number(formData.deduction_bardana) +
        Number(formData.deduction_labor) +
        Number(formData.deduction_stiching) +
        Number(formData.deduction_munshyana) +
        Number(formData.deduction_sottri) +
        Number(formData.deduction_moisture);

    const finalAmount = Math.max(0, amount - totalDeductions);

    // Fetch Vendors on Mount
    useEffect(() => {
        async function fetchVendors() {
            try {
                const res = await fetch("/api/accounts");
                if (res.ok) {
                    const data = await res.json();
                    setVendors(data);
                }
            } catch (error) {
                console.error("Failed to load vendors", error);
            }
        }
        fetchVendors();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedVendorId) {
            alert("Please select a vendor");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                account_id: selectedVendorId,
                net_weight: netWeight,
                amount: amount,
                final_amount: finalAmount,
            };

            const res = await fetch("/api/procurement/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit");
            }

            const responseData = await res.json();
            alert(`Success! Purchase ID: ${responseData.id}`);
            router.push("/"); // Redirect to dashboard or clear form?
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
                    <div className="mx-auto max-w-5xl">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold tracking-tight">Paddy Procurement</h1>
                            <div className="text-sm text-muted-foreground">
                                Gate Pass Entry (New)
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Left Column: Basic Info & Weights */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Gate Pass & Vendor</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
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
                                                    <Label>Gate Pass No</Label>
                                                    <Input
                                                        name="gate_pass_no"
                                                        placeholder="Auto/Manual"
                                                        value={formData.gate_pass_no}
                                                        onChange={handleInputChange}
                                                        type="number"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 flex flex-col">
                                                <Label>Vendor / Farmer</Label>
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={open}
                                                            className="w-full justify-between"
                                                        >
                                                            {selectedVendorId
                                                                ? vendors.find((v) => v.id === selectedVendorId)?.name
                                                                : "Select vendor..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[400px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search vendor..." />
                                                            <CommandList>
                                                                <CommandEmpty>No vendor found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {vendors.map((vendor) => (
                                                                        <CommandItem
                                                                            key={vendor.id}
                                                                            value={vendor.name}
                                                                            onSelect={() => {
                                                                                setSelectedVendorId(vendor.id);
                                                                                setOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    selectedVendorId === vendor.id ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {vendor.name}
                                                                            {vendor.legacy_pcode && <span className="ml-2 text-xs text-muted-foreground">({vendor.legacy_pcode})</span>}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Vehicle No</Label>
                                                    <Input
                                                        name="vehicle_no"
                                                        value={formData.vehicle_no}
                                                        onChange={handleInputChange}
                                                        placeholder="LES-1234"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Driver Name</Label>
                                                    <Input
                                                        name="driver_name"
                                                        value={formData.driver_name}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Weight & Goods</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Item Name</Label>
                                                <Input
                                                    name="item_name"
                                                    value={formData.item_name}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Gross Weight (kg)</Label>
                                                    <Input
                                                        type="number"
                                                        name="gross_weight"
                                                        value={formData.gross_weight}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Tare Weight (kg)</Label>
                                                    <Input
                                                        type="number"
                                                        name="tare_weight"
                                                        value={formData.tare_weight}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center border">
                                                <span className="font-medium">Net Weight</span>
                                                <span className="text-xl font-bold">{netWeight} kg</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Bags</Label>
                                                    <Input
                                                        type="number"
                                                        name="bags"
                                                        value={formData.bags}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Bag Type</Label>
                                                    <Input
                                                        name="bag_type"
                                                        value={formData.bag_type}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column: Financials */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Pricing & Financials</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 items-end">
                                                <div className="space-y-2">
                                                    <Label>Rate (per kg)</Label>
                                                    <Input
                                                        type="number"
                                                        name="rate"
                                                        value={formData.rate}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-2 text-right">
                                                    <span className="text-xs text-muted-foreground block mb-1">Gross Amount</span>
                                                    <span className="text-lg font-bold">{amount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 border-t pt-4">
                                                <Label className="text-muted-foreground">Deductions</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder="Bardana"
                                                        type="number"
                                                        name="deduction_bardana"
                                                        value={formData.deduction_bardana}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Input
                                                        placeholder="Labor"
                                                        type="number"
                                                        name="deduction_labor"
                                                        value={formData.deduction_labor}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Input
                                                        placeholder="Stiching"
                                                        type="number"
                                                        name="deduction_stiching"
                                                        value={formData.deduction_stiching}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Input
                                                        placeholder="Munshyana"
                                                        type="number"
                                                        name="deduction_munshyana"
                                                        value={formData.deduction_munshyana}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Input
                                                        placeholder="Sottri"
                                                        type="number"
                                                        name="deduction_sottri"
                                                        value={formData.deduction_sottri}
                                                        onChange={handleInputChange}
                                                    />
                                                    <Input
                                                        placeholder="Moisture/Other"
                                                        type="number"
                                                        name="deduction_moisture"
                                                        value={formData.deduction_moisture}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="text-right text-sm text-destructive font-medium">
                                                    Total Deductions: -{totalDeductions.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t flex justify-between items-center">
                                                <span className="text-lg font-bold">Net Payable</span>
                                                <span className="text-2xl font-bold text-primary">{finalAmount.toLocaleString()}</span>
                                            </div>

                                            <div className="space-y-2 pt-4">
                                                <Label>Remarks</Label>
                                                <Input
                                                    name="remarks"
                                                    value={formData.remarks}
                                                    onChange={handleInputChange}
                                                />
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
                                            Save Purchase
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
