# Oracle Fusion practice company (CA classroom)

A browser simulator of Oracle Fusion Cloud ERP for Chartered Accountancy students who have never seen an ERP. It is **not** the real Oracle cloud. The practice company is **ABC Limited, Mumbai**, in rupees.

The goods are everyday items so the class can follow the money:

| Lab | Item | Easy sum |
| --- | --- | --- |
| Lab 1 Buy and pay | Office Chair | 10 × ₹5,000 = ₹50,000, plus GST ₹9,000 |
| Lab 2 Sell and collect | Laptop | 2 × ₹50,000 = ₹1,00,000, cost ₹40,000 each |
| Case 9.1 | A4 Paper Ream | Ordered 100, received 80, billed 100 |

Units are **Nos** and **Ream**. Suppliers: Sharma Traders, Patel Papers, and Shadow Traders (not approved). Customers: Mehta Stores, Shah Stores, Desai Traders (Gujarat, so IGST).

Live class site: https://ca-darshak-m-thakkar.github.io/oracle-fusion-ca-lab/

## Class sequence

The screen leads the room. Previous is at the bottom left. Next is at the bottom right. A yellow ring shows where to click. After each step a note says what you did, why a business does it, the debit and credit, and the audit point.

1. **Day 0** — What an ERP is, Fusion versus the cloud versus old EBS, why a CA audits it, and a one-minute list of the other modules (HCM, SCM, CX, EPM, Projects, Fixed Assets, Cash Management). Then Springboard, Navigator, search and Things to Finish.
2. **Lab 1 Procure to pay** — Request 10 chairs, another role approves, buyer raises the purchase order, another role approves, warehouse receives, accounts enters a bill that matches quantity and price, cashier pays.
3. **Lab 2 Order to cash** — Sell 2 laptops, pick, ship (Ind AS 115, when the customer gets control), read the due date, collect, see an unapplied receipt, tick the bank statement.
4. **Lab 3 Ledger** — Balances, journals, a trial balance that balances, supplier aging in 0–30 / 30–60 / 60–90 / 90+ days.
5. **Lab 4 Audit** — Audit trail, Case 9.1 (look at item movement before the answer), Case 9.2 Company ABC, Company LMN (access and approval limits).

The person who prepares a document cannot approve it. Held bills cannot be paid until an approver releases them.

Dark theme and larger text are the default (body from 18px, and the control starts at 125%). A light theme and 100 / 125 / 150% text are on the login screen. The guide bar stays with you after login.

## Teacher mode

Only these emails open the presenter panel (talking points, jump to any step, free explore, reset demo data, attendance note):

- `cadmthakkar@gmail.com`

The list is `TEACHER_EMAILS` in `src/config/auth.ts`. Students never see that panel. Add another teacher by editing that list and redeploying the site.

Sign in with Google when a client ID is set. Until then, the login screen asks for name and email. Typing the teacher email on that form also opens teacher mode.

## Sign-in and the attendance sheet

Sign-in sends **only**:

- timestamp
- name
- email
- mobile: blank
- WRO: blank
- notes: `Student` or `Teacher`

Nothing is stored in this browser except the practice ledger. Mobile numbers and ICAI registration numbers are not collected and are not written to localStorage.

The sheet is **Adv ITT - Oracle Fusion**. The web app URL is in `src/config/attendance.ts`. It is a Google Apps Script deployed as “Anyone”. Anyone who knows the URL can post a row. That is a real risk: do not put secrets in the sheet, and do not treat the sheet as a private system.

### You must redeploy the script (same URL)

The script that is live today accepts the post and returns `{"status":"ok"}`, but it stores the time as text. Because of that, Total counts rows and Today / Last 7 Days / This Month stay at 0. It also does not write the Notes column.

Paste `public/sample-files/Google_Sheet_Logger_Apps_Script.gs` into the existing project, then:

1. Deploy → **Manage deployments**
2. Pencil (**Edit**) on the deployment that matches the URL in `attendance.ts`
3. Version → **New version**
4. Deploy

Do not create a brand-new deployment. A new deployment changes the URL and the site would stop logging.

After that, the next sign-in writes a real date in India time, puts Student or Teacher in Notes, converts older text timestamps, and fills the summary in columns H to J.

## Google sign-in (when you have a client ID)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and pick or create a project.
2. APIs & Services → OAuth consent screen. Choose External (or Internal if the class is on one Workspace). Add the app name “ABC Fusion classroom”. Add your email as a test user if the app stays in testing.
3. APIs & Services → Credentials → Create credentials → **OAuth client ID**.
4. Application type: **Web application**.
5. Authorised JavaScript origins — add exactly:
   - `https://ca-darshak-m-thakkar.github.io`
   - For a local class rehearsal, also `http://localhost:5173`
   Do not put the `/oracle-fusion-ca-lab` path in the origin. Origins have no path.
6. Create. Copy the client ID (it ends in `.apps.googleusercontent.com`).
7. Paste it in `src/config/auth.ts` as the value used when `VITE_GOOGLE_CLIENT_ID` is empty, **or** build with `VITE_GOOGLE_CLIENT_ID=your-id npm run build`.
8. Commit, push, and publish GitHub Pages again (see below).

Until that ID is present, the site shows the name and email form so class can continue.

## Deploy

The site is published from the `gh-pages` branch (the built files, not the source).

```bash
npm install
npm run build
```

Copy the contents of `dist/` onto the `gh-pages` branch and push that branch. `vite.config.ts` uses `base: './'` so the pages site can live in a project subpath.

Refresh the hash in the address bar to stay on the same lab step (`#payables_invoices|step=p2p-invoice`).

## What the books do

Opening balances balance. Every seeded journal balances. The trial balance shows debit and credit totals.

- Receipt of goods: Dr Receiving Inspection, Cr GR/IR, then Dr Inventory, Cr Receiving Inspection.
- Supplier bill that matches: Dr GR/IR, Dr input GST, Cr Accounts Payable.
- Payment: Dr Accounts Payable, Cr Bank.
- Ship: Dr Cost of goods sold, Cr Inventory, and Dr Accounts Receivable, Cr Sales, Cr output GST.
- Applied receipt: Dr Bank, Cr Accounts Receivable.
- Unapplied receipt: Dr Bank, Cr Unapplied customer receipts. It does not close an invoice.
