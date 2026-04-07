## Plan

### 1. Database Schema (Migrations)
Create tables in Lovable Cloud:
- **branches** — id, name, address, phone, created_by, created_at
- **products** — id, branch_id, name, category, buying_price, selling_price, stock, expiry_date, barcode
- **transactions** — id, branch_id, date, items (jsonb), total, cash_paid, balance, cashier
- **users** — id, branch_id, username, password_hash, role, name
- **business_settings** — id, business_name, address, phone

All with RLS policies so admin sees all branches, cashiers see only their branch.

### 2. Offline/Online Sync
- Keep localStorage as offline cache (current behavior)
- Add online detection (`navigator.onLine` + event listeners)
- When online: sync local changes to Cloud DB
- When offline: queue changes locally
- Show online/offline status indicator in top bar
- Auto-sync when connection restored

### 3. Branch Management UI (Admin)
- New "Branches" page in sidebar (admin only)
- Create/edit/delete branches
- Assign users to branches
- View branch-specific inventory and sales

### 4. Update Existing Pages
- POS, Inventory, Sales filter by current user's branch
- Admin can switch between branches
- Settings page updated with branch selector

### 5. Auth Migration
- Move from localStorage auth to Supabase auth (optional, can keep simple for now)
- Keep current login flow but sync user data with Cloud