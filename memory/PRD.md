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

### Bug Fixes (Feb 2, 2026)
- ✅ Fixed "Item not Found" error on Dashboard Recent Activity
  - Backend now filters out usage logs for deleted items
  - Only shows activity for items that still exist

## Tech Stack
- Frontend: React (Vite), TailwindCSS, Shadcn UI
- Backend: FastAPI, MongoDB (motor driver)
- Auth: JWT tokens
- Deployment: Vercel (frontend), Render (backend)

## Database Schema
- **users:** { id, name, email, password_hash, created_at }
- **inventory:** { id, name, category, quantity, price, supplier_url, photos[], vehicle_ids[], user_id, ... }
- **vehicles:** { id, make, model, registration, vin, photo, user_id, created_at, updated_at }
- **setups:** { id, vehicle_id, name, rating, tyre_pressure_*, ride_height_*, camber_*, toe_*, spring_rate_*, damper_*, arb_*, aero_*, event_name, event_date, notes, user_id, ... }
- **usage_logs:** { id, item_id, quantity_used, reason, event_name, user_id, created_at }

## API Endpoints
- Auth: POST /api/auth/register, /api/auth/login, GET /api/auth/me
- Inventory: GET/POST /api/inventory, GET/PUT/DELETE /api/inventory/:id
- Usage: POST /api/usage, GET /api/usage/:item_id
- Dashboard: GET /api/dashboard/stats
- Vehicles: GET/POST /api/vehicles, GET/PUT/DELETE /api/vehicles/:id
- Setups: POST /api/setups, GET /api/setups/vehicle/:id, GET/PUT/DELETE /api/setups/:id

## Prioritized Backlog

### P1 (High Priority)
- Export inventory to CSV/PDF
- Barcode/QR code scanning
- Multi-car/event support (partially done with garage feature)

### P2 (Medium Priority)
- Supplier contact integration
- Restock reminders via email
- Setup comparison feature

### P3 (Low Priority)
- Analytics dashboard with charts
- Mobile app version
- Team member roles/permissions
- Setup templates/presets

## Test Credentials
- Email: demo@rallyteam.com
- Password: rally2024
