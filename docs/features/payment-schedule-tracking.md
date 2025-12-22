# Payment Schedule & Payment Tracking Feature

## Overview

This feature allows travel agencies to configure payment schedules for itineraries and track actual payments received from clients. The shared itinerary view dynamically displays payment status including balance due.

---

## Requirements

### Agency (Itinerary Builder)
1. **Payment Schedule Configuration**
   - Set discount percentage to recalculate total
   - Enable/disable advance payment requirement
   - Configure advance as fixed amount OR percentage of total
   - Set advance payment deadline (date)
   - Set final payment deadline (date)

2. **Payment Recording**
   - Record payments when received (advance, partial, final, full)
   - Capture payment method (bank transfer, UPI, card, cash, cheque)
   - Store reference number (UTR, transaction ID)
   - Add payment date and notes
   - Edit and delete payment records

3. **Payment Summary**
   - View total amount vs total paid
   - See balance due
   - Track advance payment status (received/pending)

### Client (Shared View)
1. **Dynamic Payment Display**
   - Show total trip cost
   - Display amount already paid
   - Show remaining balance due
   - Indicate advance payment status
   - Display payment deadlines

---

## Design

### Two-Table Approach

| Table | Purpose |
|-------|---------|
| `itinerary_pricing` | Extended with payment **schedule** configuration |
| `itinerary_payments` | NEW - Tracks actual **payment records** received |

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENCY SIDE                               │
├─────────────────────────────────────────────────────────────┤
│  Itinerary Editor                                           │
│  └── PaymentSection Component                               │
│       ├── Payment Settings (discount %, advance config)     │
│       ├── Payment Records List (add/edit/delete)            │
│       └── Summary Cards (total, paid, balance)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                               │
├─────────────────────────────────────────────────────────────┤
│  GET/PUT  /itineraries/{id}/pricing                         │
│  GET/POST /itineraries/{id}/payments                        │
│  PUT/DELETE /itineraries/{id}/payments/{payment_id}         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                               │
├─────────────────────────────────────────────────────────────┤
│  Shared Itinerary View (PublicItinerary)                    │
│  └── ItineraryFooter                                        │
│       ├── Price Summary (base, taxes, discount, total)      │
│       └── Payment Status (paid, balance, deadlines)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Database Migration

**File:** `backend/migrations/add_payment_schedule.py`

Run with:
```bash
cd backend
python migrations/add_payment_schedule.py
```

### Backend Changes

#### Models

| File | Changes |
|------|---------|
| `backend/app/models/itinerary_pricing.py` | Added: `discount_percent`, `advance_enabled`, `advance_type`, `advance_amount`, `advance_percent`, `advance_deadline`, `final_deadline` |
| `backend/app/models/itinerary_payment.py` | **NEW** - Payment record model with `payment_type`, `amount`, `currency`, `payment_method`, `reference_number`, `paid_at`, `notes`, `confirmed_by` |
| `backend/app/models/itinerary.py` | Added `payments` relationship |
| `backend/app/models/__init__.py` | Export `ItineraryPayment`, `PaymentType`, `PaymentMethod` |

#### Schemas

| File | Changes |
|------|---------|
| `backend/app/schemas/itinerary_pricing.py` | Added payment schedule fields to Create/Update/Response schemas; Added `ItineraryPaymentCreate`, `ItineraryPaymentUpdate`, `ItineraryPaymentResponse`, `PaymentSummary`, `ItineraryPricingWithPayments` |
| `backend/app/schemas/share.py` | Added `PublicPaymentRecord`, `PublicPaymentSummary`; Extended `PublicPricing` with payment schedule fields; Added `payment_summary` to `PublicItineraryResponse` |

#### API Endpoints

| File | Endpoints Added |
|------|-----------------|
| `backend/app/api/v1/endpoints/itineraries.py` | `GET /{id}/pricing`, `PUT /{id}/pricing`, `GET /{id}/payments`, `POST /{id}/payments`, `PUT /{id}/payments/{payment_id}`, `DELETE /{id}/payments/{payment_id}`, `GET /{id}/payment-summary` |
| `backend/app/api/v1/endpoints/public.py` | Updated to compute and return `payment_summary` in shared view |

### Frontend Changes

| File | Changes |
|------|---------|
| `frontend/src/features/itineraries/components/PaymentSection.tsx` | **NEW** - Payment management component with settings form, payment records CRUD, summary cards |
| `frontend/src/features/itineraries/ItineraryEditor.tsx` | Import and render `PaymentSection` |
| `frontend/src/components/itinerary/ItineraryFooter.tsx` | Added `paymentSummary` prop; Display paid amount, balance due, advance status, deadlines |
| `frontend/src/features/public/PublicItinerary.tsx` | Pass `payment_summary` to `ItineraryFooter` |
| `frontend/src/api/itineraries.ts` | Added payment API functions: `getItineraryPricing`, `updateItineraryPricing`, `getPayments`, `createPayment`, `updatePayment`, `deletePayment` |
| `frontend/src/types/index.ts` | Added `PublicPaymentRecord`, `PublicPaymentSummary`; Extended `PublicPricing` with payment schedule fields |

---

## Data Models

### itinerary_pricing (Extended)

```
┌────────────────────────┬──────────────────┬─────────────────────────────┐
│ Column                 │ Type             │ Description                 │
├────────────────────────┼──────────────────┼─────────────────────────────┤
│ discount_percent       │ NUMERIC(5,2)     │ Discount as percentage      │
│ advance_enabled        │ INTEGER          │ 0=no, 1=yes                 │
│ advance_type           │ TEXT             │ 'fixed' or 'percent'        │
│ advance_amount         │ NUMERIC(10,2)    │ Fixed advance amount        │
│ advance_percent        │ NUMERIC(5,2)     │ Advance as percentage       │
│ advance_deadline       │ DATETIME         │ When advance is due         │
│ final_deadline         │ DATETIME         │ When final payment is due   │
└────────────────────────┴──────────────────┴─────────────────────────────┘
```

### itinerary_payments (New)

```
┌────────────────────────┬──────────────────┬─────────────────────────────┐
│ Column                 │ Type             │ Description                 │
├────────────────────────┼──────────────────┼─────────────────────────────┤
│ id                     │ TEXT (PK)        │ UUID                        │
│ itinerary_id           │ TEXT (FK)        │ Reference to itinerary      │
│ payment_type           │ TEXT             │ advance/partial/final/full  │
│ amount                 │ NUMERIC(10,2)    │ Payment amount              │
│ currency               │ TEXT             │ Currency code (default USD) │
│ payment_method         │ TEXT             │ bank_transfer/upi/card/etc  │
│ reference_number       │ TEXT             │ UTR, transaction ID         │
│ paid_at                │ DATETIME         │ When client made payment    │
│ notes                  │ TEXT             │ Optional notes              │
│ confirmed_by           │ TEXT (FK)        │ User who recorded payment   │
│ created_at             │ DATETIME         │ Record creation time        │
│ updated_at             │ DATETIME         │ Last update time            │
└────────────────────────┴──────────────────┴─────────────────────────────┘
```

---

## UI Components

### PaymentSection (Agency Editor)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Payment & Schedule                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Total   │  │   Paid   │  │ Balance  │  │ Advance  │                │
│  │ ₹50,000  │  │  ₹5,000  │  │ ₹45,000  │  │ Pending  │                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
├─────────────────────────────────────────────────────────────────────────┤
│  Payment Settings                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐                       │
│  │ Discount (%)    10  │  │ Final Deadline      │                       │
│  └─────────────────────┘  └─────────────────────┘                       │
│  ☑ Require Advance Payment                                              │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐                   │
│  │  Fixed   │  │ Amount 5000  │  │ Deadline Jan 15 │                   │
│  └──────────┘  └──────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Payment Records                                    [+ Record Payment]  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Advance  ₹5,000  via Bank Transfer  Jan 10, 2025  [Edit][Delete]│   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### ItineraryFooter (Shared View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Price Summary                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Base Package                                              ₹48,000      │
│  Taxes & Fees                                               ₹2,000      │
│  Discount (10%)                                            Applied      │
│  ─────────────────────────────────────────────────────────────────      │
│  Total                                                     ₹45,000      │
│  ─────────────────────────────────────────────────────────────────      │
│  ✓ Paid                                                     ₹5,000      │
│  Balance Due                                               ₹40,000      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Advance payment received                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  📅 Final payment due: Jan 30, 2025                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Pricing Endpoints

```
GET    /api/v1/itineraries/{id}/pricing
PUT    /api/v1/itineraries/{id}/pricing
```

### Payment Endpoints

```
GET    /api/v1/itineraries/{id}/payments
POST   /api/v1/itineraries/{id}/payments
PUT    /api/v1/itineraries/{id}/payments/{payment_id}
DELETE /api/v1/itineraries/{id}/payments/{payment_id}
GET    /api/v1/itineraries/{id}/payment-summary
```

### Public Endpoint (Updated)

```
GET    /api/v1/public/itinerary/{token}
       └── Now includes `payment_summary` in response
```
