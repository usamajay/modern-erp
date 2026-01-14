// End-to-End Verification Script (v2)
// Usage: node scripts/verify_app_v2.js

const API_BASE = "http://127.0.0.1:3000/api";

async function verify() {
    console.log("🚀 Starting End-to-End Test (v2)...");

    try {
        // 1. Setup: Get a Vendor and a Customer
        console.log("\n1️⃣  Fetching Accounts...");
        const accountsRes = await fetch(`${API_BASE}/accounts`);
        if (!accountsRes.ok) {
            const txt = await accountsRes.text();
            throw new Error(`Failed to fetch accounts (Status: ${accountsRes.status}): ${txt}`);
        }
        const accounts = await accountsRes.json();

        // Just pick first account as Vendor & Customer for test
        const testAccount = accounts[0];
        if (!testAccount) throw new Error("No accounts found. Please seed database.");
        console.log(`   Selected Account: ${testAccount.name} (ID: ${testAccount.id})`);

        // 2. Procurement (Buy Paddy)
        console.log("\n2️⃣  Testing Procurement (Buying Paddy)...");
        const purchasePayload = {
            date: new Date().toISOString().split('T')[0],
            gate_pass_no: 9999,
            vehicle_no: "TEST-E2E",
            account_id: testAccount.id,
            item_name: "Test Paddy",
            bags: 100,
            gross_weight: 10000,
            tare_weight: 0,
            net_weight: 10000,
            rate: 100, // 100/kg
            amount: 1000000, // 1M
            final_amount: 1000000,
            remarks: "E2E Test Purchase"
        };

        const purRes = await fetch(`${API_BASE}/procurement/purchase`, {
            method: 'POST',
            body: JSON.stringify(purchasePayload),
            headers: { 'Content-Type': 'application/json' }
        });
        const purData = await purRes.json();
        if (!purRes.ok) throw new Error(`Procurement Failed: ${JSON.stringify(purData)}`);
        console.log(`   ✅ Purchase Successful! ID: ${purData.id}`);


        // 3. Production (Milling)
        console.log("\n3️⃣  Testing Production (Milling)...");
        const prodPayload = {
            date: new Date().toISOString().split('T')[0],
            batch_no: "BATCH-TEST",
            input_qty: 10000,
            output_head_rice: 6000,
            output_broken_rice: 3000,
            output_bran: 500,
            output_husk: 500,
            output_dirt: 0,
            remarks: "E2E Test Batch"
        };

        const prodRes = await fetch(`${API_BASE}/production/batch`, {
            method: 'POST',
            body: JSON.stringify(prodPayload),
            headers: { 'Content-Type': 'application/json' }
        });
        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(`Production Failed: ${JSON.stringify(prodData)}`);
        console.log(`   ✅ Production Batch Successful! ID: ${prodData.id}`);


        // 4. Sales (Selling Rice)
        console.log("\n4️⃣  Testing Sales (Invoicing)...");
        const invPayload = {
            date: new Date().toISOString().split('T')[0],
            invoice_no: `INV-${Date.now().toString().slice(-6)}`,
            account_id: testAccount.id,
            items: [
                { item_name: "Test Rice", quantity: 100, rate: 200, amount: 20000 }
            ],
            total_amount: 20000,
            final_amount: 20000,
            remarks: "E2E Test Invoice"
        };

        const salesRes = await fetch(`${API_BASE}/sales/invoice`, {
            method: 'POST',
            body: JSON.stringify(invPayload),
            headers: { 'Content-Type': 'application/json' }
        });
        const salesData = await salesRes.json();
        if (!salesRes.ok) throw new Error(`Sales Failed: ${JSON.stringify(salesData)}`);
        console.log(`   ✅ Invoice Successful! ID: ${salesData.id}`);


        // 5. Verify Ledger
        console.log("\n5️⃣  Verifying Financial Ledger...");
        const ledgerRes = await fetch(`${API_BASE}/financials/ledger?account_id=${testAccount.id}`);
        const ledgerEntries = await ledgerRes.json();

        if (!ledgerRes.ok) throw new Error("Failed to fetch ledger");

        console.log(`   Found ${ledgerEntries.length} Ledger Entries for ${testAccount.name}:`);
        ledgerEntries.forEach(entry => {
            console.log(`   - [${entry.voucher_type}] ${entry.description}: Dr ${entry.debit} / Cr ${entry.credit}`);
        });

        // Check if our test transactions appear
        const hasPurchase = ledgerEntries.some(e => e.voucher_type === 'PU' && Number(e.credit) == 1000000);
        const hasInvoice = ledgerEntries.some(e => e.voucher_type === 'IV' && Number(e.debit) == 20000);

        if (hasPurchase && hasInvoice) {
            console.log("\n✅ SUCCESS: All transactions verified in General Ledger!");
        } else {
            console.log("   (Note: Checked for Credit 1000000 and Debit 20000)");
            console.warn("\n⚠️  WARNING: Ledger verification partial or failed. See transactions above.");
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
        process.exit(1);
    }
}

verify();
