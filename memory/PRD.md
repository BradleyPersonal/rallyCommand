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

## What's Been Implemented (Jan 31, 2026)
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

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI
- Backend: FastAPI, MongoDB
- Auth: JWT tokens

## Prioritized Backlog

### P0 (Critical) - Done
- User auth ✅
- Inventory CRUD ✅
- Low stock alerts ✅

### P1 (High Priority)
- Export inventory to CSV/PDF
- Barcode/QR code scanning
- Multi-car/event support

### P2 (Medium Priority)
- Photo attachments for items
- Supplier contact integration
- Restock reminders via email

### P3 (Low Priority)
- Analytics dashboard with charts
- Mobile app version
- Team member roles/permissions

## Next Tasks
1. Add export to CSV functionality
2. Add image upload for inventory items
3. Add reorder/restock quick action
