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

### Phase 7 - Stocktake Feature (Feb 4, 2026)
- ✅ **Stocktake Report** accessible from Inventory page
  - Two options: Complete on Device OR Generate PDF Printout
- ✅ **On-Device Stocktake:**
  - **List View** showing all items (parts, tools, fluids) with name, location, and quantity
  - Click any item to open count screen
  - Back button returns to list without saving
  - Save Count button saves and returns to list
  - Green checkmark and background for counted items
  - Discrepancy badges (+/-X) shown on list
  - Summary screen with stats: items counted, matched, over, under
  - Total value difference calculation
  - Save stocktake record and apply corrections to inventory
- ✅ **PDF Printout:**
  - Light grid lines (not bold)
  - Includes: item name, category, location, stock quantity, empty count column, unit price, total value
  - Print-friendly formatting with signature/date fields
- ✅ **Stocktake History:**
  - View all past stocktakes from Inventory page
  - Shows date, items counted, discrepancies, value difference, status
  - Click to view detailed breakdown
  - Delete old stocktake records

### Phase 8 - Part Condition Field (Feb 4, 2026)
- ✅ **Part Condition dropdown** added to inventory form (only shown for parts category)
  - Options: New, Used - Good, Used - Fair, Poor/Damaged
  - Stored in database and displayed on item details

### Phase 9 - Feedback System (Feb 4-5, 2026)
- ✅ **Feedback menu** in top right of navbar (message icon)
  - Dropdown with "Report Bug" and "Suggest Feature" options
- ✅ **Feedback dialog** with:
  - Type selection (Bug Report / Feature Request)
  - Name input field (required)
  - **Email input field (OPTIONAL)**
    - Shows "(optional)" label
    - Hint text: "If provided, must end with .com or .co.nz"
    - Validation: Only accepts .com or .co.nz domain extensions
  - Message textarea with contextual placeholder
- ✅ **Email integration** using Resend API (via httpx HTTP POST)
  - Sends formatted HTML email to francisdevstudios@gmail.com
  - Includes reply-to header ONLY if email is provided
  - Stores feedback records in database
- ✅ **Success confirmation** with thank you message

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
- **inventory:** { id, name, category, subcategory, condition, quantity, price, supplier_url, photos[], vehicle_ids[], user_id, ... }
- **vehicles:** { id, make, model, registration, vin, photo, user_id, created_at, updated_at }
- **setups:** { id, vehicle_id, name, conditions, rating, tyre_pressure_*, ride_height_*, camber_*, toe_*, spring_rate_*, damper_*, arb_*, aero_*, event_name, event_date, notes, user_id, ... }
- **usage_logs:** { id, item_id, quantity_used, reason, event_name, user_id, created_at }
- **repairs:** { id, vehicle_id, cause_of_damage, affected_area, parts_used[], total_parts_cost, repair_details, technicians[], user_id, created_at, updated_at }
- **stocktakes:** { id, user_id, items[], total_items_counted, items_matched, items_over, items_under, total_value_difference, status, notes, created_at, applied_at }

### Phase 10 - Garage Feature Rework & Global Vehicle Filter (Feb 5, 2026)
- ✅ **Navbar restructure**
  - Moved "Garage" button to right side of navbar (next to Feedback)
  - Added "Setups" nav item in main nav (Dashboard, Inventory, Setups, Repairs)
- ✅ **Garage dropdown menu** with:
  - "View Garage" option → navigates to /garage page
  - List of user's saved vehicles
  - "All Vehicles" option to clear filter
  - Checkmark indicator on selected option
- ✅ **Global vehicle filter context**
  - VehicleFilterContext for app-wide filter state
  - Filter persists across page navigation
  - Filter persists after page refresh (localStorage)
  - Garage button shows selected vehicle name (blue highlighted)
- ✅ **Filter indicator badge**
  - Shows "Filtering: [Vehicle Name]" when active
  - X button to clear filter
- ✅ **Page filtering behavior**
  - Dashboard: Stats and recent activity filtered by vehicle
  - Inventory: Shows items for selected vehicle OR items with no vehicle assigned
  - Setups: Shows only setups for selected vehicle
  - Repairs: Shows only repairs for selected vehicle
- ✅ **New Setups page** (/setups)
  - Similar to Repairs page layout
  - Shows all setups across all vehicles
  - Search functionality
  - New Setup button with vehicle selector

### Phase 11 - UI Refinements (Feb 5, 2026)
- ✅ **Removed local vehicle filters** from:
  - Inventory page (global Garage filter still works)
  - Setups page (search-only now)
  - Repairs page (replaced with search + sort)
- ✅ **Repairs page enhancements**
  - Search by title (cause of damage) and affected area
  - Sort by: Date (Newest/Oldest), Cost (High/Low)
- ✅ **Part Condition display**
  - Shows on Item Detail page only (not list view)
  - Color-coded badge: New (green), Used (yellow), Refurbished (blue)

### Phase 12 - Mobile Responsiveness (Feb 5, 2026)
- ✅ **Inventory table responsive columns** (progressive hiding):
  - XL+ (1280px+): All columns visible
  - LG (1024px+): Hide Location
  - MD (768px+): Hide Part #
  - SM (640px+): Hide Category
  - XS (<640px): Show only Name, Qty, Actions
- ✅ **Profile menu moved to burger menu** on mobile
  - Full-width touch-friendly navigation items
  - User profile section with name/email
  - Logout button
  - Send Feedback option
- ✅ **Garage button simplified** on mobile (icon only)
- ✅ **Reduced heading sizes** on mobile (text-3xl instead of text-4xl/5xl)
- ✅ **Stacked filter buttons** on mobile screens
- ✅ **Compact stat cards** on mobile (2-column grid, smaller padding)
- ✅ **Touch-friendly button sizing** throughout

### Phase 13 - Stocktake Vehicle Filter (Feb 6, 2026)
- ✅ **Vehicle filter dropdown** in stocktake dialog
  - "All Vehicles" option (default) - includes all inventory items
  - Specific vehicle options - includes items for that vehicle OR universal items (no vehicle assigned)
- ✅ **Dynamic item count** updates based on selected vehicle filter
- ✅ **Helper text** explains what items will be included
- ✅ **PDF generation** respects vehicle filter and includes filter info in header

## API Endpoints
- Auth: POST /api/auth/register, /api/auth/login, GET /api/auth/me
- Inventory: GET/POST /api/inventory, GET/PUT/DELETE /api/inventory/:id
- Usage: POST /api/usage, GET /api/usage/:item_id
- Dashboard: GET /api/dashboard/stats (returns recent_activity, recent_setups, recent_repairs)
- Vehicles: GET/POST /api/vehicles, GET/PUT/DELETE /api/vehicles/:id
- Setups: POST /api/setups, GET /api/setups/vehicle/:id?search=, GET/PUT/DELETE /api/setups/:id
- Repairs: GET/POST /api/repairs, GET /api/repairs/vehicle/:id, GET/PUT/DELETE /api/repairs/:id
- Stocktakes: GET/POST /api/stocktakes, GET/DELETE /api/stocktakes/:id, POST /api/stocktakes/:id/apply
- Feedback: POST /api/feedback (sends email via Resend)

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
