# RallyCommand - Rally Car Inventory Management

## Original Problem Statement
Build an app that can keep track of inventory for a rally car.

## User Persona
- Rally car team members
- Mechanics and engineers
- Team managers

## Core Requirements
- Track parts, tools, and fluids
- Store detailed info: name, quantity, location, part number, supplier, price
- Low stock alerts when quantity <= min_stock
- Usage history logging
- JWT authentication for team access
- Dark motorsport theme

## What's Been Implemented

### Phase 1 - Core Features (Jan 31, 2026)
- ✅ User registration and login with JWT auth
- ✅ Dashboard with stats (total items, low stock count, total value, categories)
- ✅ Inventory CRUD (Create, Read, Update, Delete)
- ✅ Category filtering (parts, tools, fluids)
- ✅ Search by name, part number, supplier
- ✅ Low stock filter and alerts
- ✅ Usage logging with event/reason tracking
- ✅ Item detail page with usage history
- ✅ Dark motorsport UI theme with Barlow Condensed + JetBrains Mono fonts
- ✅ Mobile responsive design

### Phase 2 - Enhanced Features (Jan 31, 2026)
- ✅ Clickable dashboard cards (Total Items, Low Stock, Categories)
- ✅ Clickable inventory part names linking to detail pages
- ✅ Supplier URL field for inventory items
- ✅ Photo uploads (up to 3 per item) with gallery viewer
- ✅ Vehicle Garage (manage up to 2 vehicles)
- ✅ Part attribution to vehicles
- ✅ Restock functionality from item detail page

### Phase 3 - Vehicle Setups Feature (Feb 2, 2026)
- ✅ Vehicle Detail Page (/vehicle/:id)
- ✅ Clickable vehicle cards on Garage page
- ✅ Vehicle Setup CRUD (Create, Read, Update, Delete)
- ✅ Setup form with comprehensive fields:
  - Setup name and rating (1-5 stars)
  - Event name and date
  - **Conditions field** (sunny, dry, raining, wet, mixed, dusty, muddy, snow/ice)
  - Tyre pressures (all 4 corners)
  - Ride height (all 4 corners)
  - Camber (front/rear)
  - Toe (front/rear)
  - Spring rates (front/rear)
  - Damper settings (front/rear)
  - ARB settings (front/rear)
  - Aero settings (front/rear)
  - Notes
- ✅ Setup View Dialog showing all details
- ✅ Interactive star rating component
- ✅ **Search setups by keyword** (searches title, event, conditions)

### Phase 4 - Repair Logs Feature (Feb 2, 2026)
- ✅ Repair Logs page accessible from navbar
- ✅ Repair Log CRUD (Create, Read, Update, Delete)
- ✅ Repair form with fields (in order):
  - Vehicle selection
  - Cause of Damage
  - Affected Area
  - Parts Used (from inventory OR new parts)
  - Cost of Parts (automatic calculation from inventory)
  - Repair Details
  - Technicians (who worked on repair)
- ✅ Automatic inventory deduction when using parts from inventory
- ✅ Repairs visible from main Repairs page
- ✅ Repairs visible from Vehicle Detail page (Repair History section)
- ✅ Total parts cost calculation
- ✅ **Vehicle filter on Repairs page** (filter repairs by vehicle)

### Phase 5 - Inventory Subcategories & Filters (Feb 3, 2026)
- ✅ Part Type subcategory for Parts category:
  - Options: Panel, Suspension, Driveline, Powertrain, Other
  - Subcategory dropdown appears in item form only when "Parts" category is selected
- ✅ Subcategory filter on Inventory page:
  - Only appears when Parts category filter is applied
  - Allows filtering by specific part types
- ✅ Vehicle filter on Inventory page:
  - Filter inventory by applicable vehicle
  - Shows all vehicles from garage

### Phase 6 - Dashboard & UI Enhancements (Feb 3, 2026)
- ✅ **Dashboard Recent Activity shows all types** (usage logs, setups, repairs)
  - Color-coded: Red/primary for usage, Blue for setups, Orange for repairs
  - Includes icons to distinguish activity types
  - Links to respective detail pages
- ✅ **Limited to 5 most recent items** (sorted by date across all types)
- ✅ Vehicle Detail page shows limited items:
  - 4 most recent setups in 2x2 grid
  - 2 most recent repairs
  - "View All" buttons link to full list pages

### Bug Fixes (Feb 2, 2026)
- ✅ Fixed "Item not Found" error on Dashboard Recent Activity
  - Backend now filters out usage logs for deleted items
  - Only shows activity for items that still exist
- ✅ Fixed Setup Form to only show Rating when editing (not creating)
  - Users can now rate setups only after they've been created and tested
  - Improved error handling with better validation messages
  - Added console logging for debugging setup creation issues

## Tech Stack
- Frontend: React (Vite), TailwindCSS, Shadcn UI
- Backend: FastAPI, MongoDB (motor driver)
- Auth: JWT tokens
- Deployment: Vercel (frontend), Render (backend)

## Database Schema
- **users:** { id, name, email, password_hash, created_at }
- **inventory:** { id, name, category, subcategory, quantity, price, supplier_url, photos[], vehicle_ids[], user_id, ... }
- **vehicles:** { id, make, model, registration, vin, photo, user_id, created_at, updated_at }
- **setups:** { id, vehicle_id, name, conditions, rating, tyre_pressure_*, ride_height_*, camber_*, toe_*, spring_rate_*, damper_*, arb_*, aero_*, event_name, event_date, notes, user_id, ... }
- **usage_logs:** { id, item_id, quantity_used, reason, event_name, user_id, created_at }
- **repairs:** { id, vehicle_id, cause_of_damage, affected_area, parts_used[], total_parts_cost, repair_details, technicians[], user_id, created_at, updated_at }

## API Endpoints
- Auth: POST /api/auth/register, /api/auth/login, GET /api/auth/me
- Inventory: GET/POST /api/inventory, GET/PUT/DELETE /api/inventory/:id
- Usage: POST /api/usage, GET /api/usage/:item_id
- Dashboard: GET /api/dashboard/stats (returns recent_activity, recent_setups, recent_repairs)
- Vehicles: GET/POST /api/vehicles, GET/PUT/DELETE /api/vehicles/:id
- Setups: POST /api/setups, GET /api/setups/vehicle/:id?search=, GET/PUT/DELETE /api/setups/:id
- Repairs: GET/POST /api/repairs, GET /api/repairs/vehicle/:id, GET/PUT/DELETE /api/repairs/:id

## Prioritized Backlog

### P1 (High Priority)
- Analytics dashboard with charts (inventory usage trends, repair costs)
- Export inventory to CSV/PDF

### P2 (Medium Priority)
- Maintenance scheduling reminders
- Team roles/permissions
- Setup templates/presets
- Barcode/QR code scanning

### P3 (Low Priority)
- Supplier contact integration
- Restock reminders via email
- Mobile app version

## Test Credentials
- Email: demo@rallyteam.com
- Password: rally2024
