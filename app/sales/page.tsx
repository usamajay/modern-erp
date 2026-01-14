"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
    id: number;
    name: string;
}

interface InvoiceItem {
    id: number;
    item_name: string;
    quantity: number;
    rate: number;
    amount: number;
}

export default function SalesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Account[]>([]);

    // Combobox
    const [open, setOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    // Form Data
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [invoiceNo, setInvoiceNo] = useState(`INV-${new Date().getTime().toString().slice(-6)}`);
    const [remarks, setRemarks] = useState("");
    const [discount, setDiscount] = useState(0);

    // Items
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: 1, item_name: "Super Basmati Rice (25kg)", quantity: 1, rate: 0, amount: 0 }
    ]);

    // Computed
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const finalAmount = Math.max(0, subTotal - discount);

    useEffect(() => {
        async function fetchCustomers() {
            try {
                const res = await fetch("/api/accounts");
                if (res.ok) {
                    const data = await res.json();
                    setCustomers(data);
                }
            } catch (e) {
                console.error("Failed to load customers", e);
            }
        }
        fetchCustomers();
    }, []);

    const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
        setItems((prev) => prev.map((item) => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate amount if qty or rate changes
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = Number(updated.quantity) * Number(updated.rate);
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            { id: Date.now(), item_name: "", quantity: 1, rate: 0, amount: 0 }
        ]);
    };

    const removeItem = (id: number) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedCustomerId) {
            alert("Select a customer");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                date,
                invoice_no: invoiceNo,
                account_id: selectedCustomerId,
                items,
                total_amount: subTotal,
                discount_amount: discount,
                final_amount: finalAmount,
                remarks
            };

            const res = await fetch("/api/sales/invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit");
            }

            alert("Invoice Created Successfully!");
            router.push("/");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error creating invoice");
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
                            <h1 className="text-3xl font-bold tracking-tight">Sales Invoice</h1>
                            <div className="text-sm text-muted-foreground">
                                Create New Customer Invoice
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6">

                                {/* Header Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Invoice Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Invoice No</Label>
                                            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2 flex flex-col">
                                            <Label>Customer</Label>
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={open}
                                                        className="w-full justify-between"
                                                    >
                                                        {selectedCustomerId
                                                            ? customers.find((c) => c.id === selectedCustomerId)?.name
                                                            : "Select customer..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search customer..." />
                                                        <CommandList>
                                                            <CommandEmpty>No customer found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {customers.map((customer) => (
                                                                    <CommandItem
                                                                        key={customer.id}
                                                                        value={customer.name}
                                                                        onSelect={() => {
                                                                            setSelectedCustomerId(customer.id);
                                                                            setOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {customer.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Items Table */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Items</CardTitle>
                                        <Button type="button" size="sm" onClick={addItem}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Item
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[40%]">Item Description</TableHead>
                                                    <TableHead className="w-[15%]">Qty</TableHead>
                                                    <TableHead className="w-[20%]">Rate</TableHead>
                                                    <TableHead className="w-[20%] text-right">Amount</TableHead>
                                                    <TableHead className="w-[5%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <Input
                                                                value={item.item_name}
                                                                onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                                                                placeholder="Item Name"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.rate}
                                                                onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {item.amount.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive"
                                                                onClick={() => removeItem(item.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Footer Totals */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Label>Remarks / Payment Terms</Label>
                                        <Input
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="e.g. Payment due in 7 days"
                                        />
                                    </div>
                                    <Card>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-semibold">{subTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Discount</span>
                                                <Input
                                                    type="number"
                                                    className="w-32 text-right h-8"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex justify-between border-t pt-4">
                                                <span className="text-lg font-bold">Total Payable</span>
                                                <span className="text-xl font-bold text-primary">{finalAmount.toLocaleString()}</span>
                                            </div>

                                            <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Create Invoice
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
