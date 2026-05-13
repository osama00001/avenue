# Bug Fixes — Apply These First (Blocking)

Apply on the live server before running any sync scripts.

---

## Fix 1 — Wrong model import in 3 API routes

In each of the three files below, find line 2 and change `oldBook` → `Book`:

### src/app/api/(home)/books/route.js
```js
// CHANGE:
import Book from "@/models/oldBook";
// TO:
import Book from "@/models/Book";
```

### src/app/api/(home)/books/[id]/route.js
```js
// CHANGE:
import Book from "@/models/oldBook";
// TO:
import Book from "@/models/Book";
```

### src/app/api/admin/books/route.js
```js
// CHANGE:
import Book from "@/models/oldBook";
// TO:
import Book from "@/models/Book";
```

Verify after: `grep -r "oldBook" src/app/api/` — should return nothing.

---

## Fix 2 — Add coverImage field to Book model

In `src/models/Book.js`, find the BookSchema definition and add `coverImage` alongside the other top-level fields (near `status`, `isSellable`, `meta`):

```js
coverImage: { type: String },
```

---

## Fix 3 — Add gardnersFulfilment block to Order model

In `src/models/Order.js`, add this block to the schema (top-level, alongside existing fields):

```js
gardnersFulfilment: {
  orderRef:           { type: String },   // our 10-digit ref sent to Gardners
  gardnersRef:        { type: String },   // GARDNERSREF from ACK file
  dispatchNo:         { type: String },   // from DISPATCH/HDD file
  trackingNumber:     { type: String },   // extracted from DETAIL fields
  dispatchDate:       { type: Date },
  carrier:            { type: String },
  serviceCode:        { type: String },
  ackStatus: {
    type: String,
    enum: ['pending', 'accepted', 'partial', 'backordered', 'rejected'],
    default: 'pending'
  },
  ediSentAt:          { type: Date },
  ackReceivedAt:      { type: Date },
  dispatchReceivedAt: { type: Date }
},
```

---

## Fix 4 — CORS: add production domain to middleware.js

In `src/middleware.js`, find the `allowedOrigins` array and add:
```js
"https://avenuebookstore.com",
```

Also remove `"https://avenue-beta.vercel.app"` if the Vercel preview is no longer in use.

---

## Fix 5 — NEXTAUTH_SECRET

```bash
# Run on server, paste output into .env.local
openssl rand -base64 32
```

In `.env.local`:
```
NEXTAUTH_SECRET=<output from above>
```

---

## Fix 6 — SYNC_SECRET (new)

```bash
openssl rand -hex 32
```

Add to `.env.local`:
```
SYNC_SECRET=<output from above>
```

---

## Fix 7 — Add Gardners env vars to .env.local

Append to `/var/www/vhosts/avenuebookstore.com/httpdocs/.env.local`:

```bash
# Gardners Physical FTP
GARDNERS_PHYSICAL_FTP_HOST=data.gardners.com
GARDNERS_PHYSICAL_FTP_USER=AVE011FTP
GARDNERS_PHYSICAL_FTP_PASS=62AVu42H2y

# Gardners Covers FTP
GARDNERS_COVERS_FTP_HOST=covers.gardners.com
GARDNERS_COVERS_FTP_USER=EB1196COVERSFTP
GARDNERS_COVERS_FTP_PASS=uMhKk54GDt

# Gardners LCP API (pending from Katie)
GARDNERS_LCP_API_URL=https://testconnect4.gardners.com/Ebook/place_lcp_order
GARDNERS_LCP_USERNAME=TBD
GARDNERS_LCP_PASSWORD=TBD
GARDNERS_LCP_CUSTOMER_CODE=TBD
GARDNERS_LCP_AES_KEY=TBD
```

---

## Fix 8 — Create covers directory

```bash
mkdir -p /var/www/vhosts/avenuebookstore.com/httpdocs/public/covers
chmod 755 /var/www/vhosts/avenuebookstore.com/httpdocs/public/covers
```
