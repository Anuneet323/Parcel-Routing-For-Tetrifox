# Frontend Architecture & Execution Flow

This document details the file structure and logic flow of the frontend React application. It explains the user interface transitions, splash screen boot loader sequence, page routing, and connection to the backend service.

---

## 📂 Folder Structure

```text
frontend/src/
├── assets/              # Static assets (images, SVGs)
├── components/          # Reusable UI widgets
│   ├── BootLoader.jsx   # Custom animated splash loader
│   └── Navbar.jsx       # Application header and navigation tab toggler
├── pages/               # Main view containers
│   ├── BatchUpload.jsx  # Bulk parcel processing interface
│   ├── Dashboard.jsx    # Metrics cards, parcels log, and error feeds
│   ├── Login.jsx        # Credentials submission interface
│   └── SingleRoute.jsx  # Single parcel validator form and result display
├── services/            # Backend communication client
│   └── api.js           # Axios instance mapping REST routes
├── index.css            # Stylesheets, variables, custom styling tokens
├── main.jsx             # React entry point
└── App.jsx              # Main shell coordinate (boot controller and tab switcher)
```

---

## 🔄 Booting & Component Hierarchy

The frontend is structured as a Single Page Application (SPA). The diagram below illustrates the rendering tree and application lifecycles:

```
                  ┌──────────────────┐
                  │    main.jsx      │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │     App.jsx      │
                  └────────┬─────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [ Boot Phase ]              [ Loaded Phase ]
┌──────────────────────┐    ┌──────────────────────┐
│    BootLoader.jsx    │    │      Navbar.jsx      │
│  (Displays animated  │    └──────────┬───────────┘
│   loading circle)    │               │  Toggles 'activeTab'
└──────────────────────┘               ▼
                             ┌──────────────────┐
                             │  AnimatePresence │ (Transitions pages smoothly)
                             └─────────┬────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
      ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
      │  Dashboard.jsx   │   │  SingleRoute.jsx │   │  BatchUpload.jsx │
      └──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## ⚙️ Core Application Flows

### 1. The Startup Splash Sequence (Font Detection)
To maintain a high-quality visual feel, the application uses a smart Bootloader in `App.jsx`:

1.  On render, the app shows `<BootLoader />` and hides the main page.
2.  It monitors the browser font loading state using the Promise `document.fonts.ready`.
3.  **Loading Delays:**
    *   *Minimum Window:* The splash screen is kept visible for at least `1100ms` (`BOOT_MIN_VISIBLE_MS`) to prevent it from flickering on ultra-fast networks.
    *   *Fallback Limit:* A safety timer clears the loader after `2500ms` (`BOOT_FALLBACK_MS`) if the network stalls.
4.  Once the Promise settles and the minimum delay finishes, `isBooting` switches to `false`.
5.  **Framer Motion** animates the splash screen scaling up and fading away smoothly.

---

### 2. Page Navigation Flow
Instead of refreshing the page, navigation is managed using standard React state:
*   `App.jsx` declares `activeTab` state (defaulting to `'dashboard'`).
*   `Navbar.jsx` updates this state when navigation tabs are clicked.
*   `renderContent()` returns the matching component page (`<Dashboard />`, `<SingleRoute />`, or `<BatchUpload />`).
*   `<motion.div>` animates the old page sliding up/out and the new page fading in.

---

### 3. API Integration & State Flows (`services/api.js`)

All pages use **Axios** to communicate with the backend, fetching or modifying data dynamically:

#### **Dashboard Page Flow**
1.  Mounting triggers `/api/parcels/stats` to retrieve the key performance indicators (KPIs).
2.  Also queries `/api/parcels` to get recent items, and `/api/parcels/errors` to populate debug feeds.
3.  Clicking "Reset Console" fires `resetStats()`, clearing all database metrics and refreshing the UI values back to zero.

#### **Single Route Page Flow**
1.  User enters weight, value, and destination in the input form.
2.  Form state is validated on submit.
3.  Calls `routeSingle(parcelData)`. 
4.  Upon success, the component renders animated cards detailing whether the parcel is successfully `ROUTED` (and to which department) or held for `PENDING_INSURANCE_APPROVAL`.

#### **Batch Upload Page Flow**
1.  Accepts a dropped `.json` file or text paste.
2.  Reads and validates the formatting format (matching the structure model example).
3.  Calls `routeBatch(batchData)`.
4.  Processes the bulk array response, mapping rows to a success/failure table highlighting errors in red and successful routes in green.
