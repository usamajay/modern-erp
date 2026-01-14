"use client";

import { useState, useEffect } from "react";
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
import { Check, ChevronsUpDown, Loader2, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
    id: number;
    name: string;
}

interface LedgerEntry {
    id: number;
    date: string;
    voucher_type: string;
    voucher_no: number;
    description: string;
    debit: number;
    credit: number;
    account_name: string;
}

export default function FinancialsPage() {
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedAccountId) params.append("account_id", selectedAccountId.toString());
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const res = await fetch(`/api/financials/ledger?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load");

            const data = await res.json();
            setEntries(data);
        } catch (e) {
            console.error(e);
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
                    <div className="mx-auto max-w-6xl">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </div>
                        </div>

                        <Card className="mb-6">
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2 flex flex-col">
                                        <Label>Account (Optional)</Label>
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
                                                        : "All Accounts"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[250px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search account..." />
                                                    <CommandList>
                                                        <CommandEmpty>No account found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value="all"
                                                                onSelect={() => {
                                                                    setSelectedAccountId(null);
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedAccountId === null ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                All Accounts
                                                            </CommandItem>
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
                                        <Label>Start Date</Label>
                                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                    <Button onClick={fetchLedger} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" /> : "View Report"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Ref</TableHead>
                                            <TableHead>Account</TableHead>
                                            <TableHead className="w-[400px]">Description</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Credit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entries.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                    No transactions found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            entries.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{entry.voucher_type}-{entry.voucher_no}</TableCell>
                                                    <TableCell className="font-medium text-muted-foreground">{entry.account_name}</TableCell>
                                                    <TableCell>{entry.description}</TableCell>
                                                    <TableCell className="text-right font-medium text-primary">
                                                        {Number(entry.debit) > 0 ? Number(entry.debit).toLocaleString() : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-destructive">
                                                        {Number(entry.credit) > 0 ? Number(entry.credit).toLocaleString() : "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
