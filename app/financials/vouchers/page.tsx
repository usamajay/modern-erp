"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Account {
    id: number;
    name: string;
}

export default function VoucherPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [voucherType, setVoucherType] = useState("CP"); // Default Cash Payment
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // Account Picker
    const [open, setOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchAccounts() {
            try {
                const res = await fetch("/api/accounts");
                if (res.ok) setAccounts(await res.json());
            } catch (e) { console.error(e); }
        }
        fetchAccounts();
    }, []);

    const handleSubmit = async () => {
        if (!selectedAccountId || !amount) {
            alert("Please select an Account and enter an Amount.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                date,
                voucher_type: voucherType,
                account_id: selectedAccountId,
                amount: Number(amount),
                description
            };

            const res = await fetch("/api/financials/voucher", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            // Success
            alert("Voucher Saved Successfully!");

            // Reset Form
            setAmount("");
            setDescription("");

        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message}`);
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
                    <div className="mx-auto max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight mb-6">Financial Voucher</h1>

                        <Card>
                            <CardHeader>
                                <CardTitle>New Transaction</CardTitle>
                                <CardDescription>Record Cash Payments, Receipts, or Bank transfers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Voucher Type</Label>
                                        <Select value={voucherType} onValueChange={setVoucherType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CP">Cash Payment (CP)</SelectItem>
                                                <SelectItem value="CR">Cash Receipt (CR)</SelectItem>
                                                <SelectItem value="BP">Bank Payment (BP)</SelectItem>
                                                <SelectItem value="BR">Bank Receipt (BR)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2 flex flex-col">
                                    <Label>Party Account</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="justify-between"
                                            >
                                                {selectedAccountId
                                                    ? accounts.find((a) => a.id === selectedAccountId)?.name
                                                    : "Select Customer/Vendor..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search account..." />
                                                <CommandList>
                                                    <CommandEmpty>No account found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {accounts.map((acc) => (
                                                            <CommandItem
                                                                key={acc.id}
                                                                value={acc.name}
                                                                onSelect={() => {
                                                                    setSelectedAccountId(acc.id);
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedAccountId === acc.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {acc.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="text-lg font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description / Remarks</Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g. Payment for Invoice #123"
                                    />
                                </div>

                                <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Voucher
                                </Button>

                            </CardContent>
                        </Card>

                    </div>
                </main>
            </div>
        </div>
    );
}
