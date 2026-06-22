# Backend Architecture & Execution Flow

This document details the folder structure and execution flow of the backend routing system. It is designed to help developers quickly understand how data passes through the application layers.

---

## 📂 Folder Structure

```text
backend/src/
├── config/              # Global setups (DB connections, Sentry, Logger configs)
│   ├── db.js
│   ├── logger.js
│   ├── rules.json       # Routing rule configurations
│   └── sentry.js
├── controllers/         # Web/HTTP Interface controllers (extract payloads, send JSON)
│   ├── authController.js
│   └── parcelController.js
├── middleware/          # Express route middlewares (Validation execution, Error handlers)
│   ├── auth.js
│   ├── errorHandler.js
│   └── validate.js
├── models/              # Mongoose collection schemas (data definitions)
│   ├── auditLog.js
│   └── parcel.js
├── repositories/        # Database Access layer (raw Mongoose queries)
│   ├── auditLogRepository.js
│   └── parcelRepository.js
├── routes/              # Express HTTP routers (mapping routes to controllers)
│   ├── authRoutes.js
│   └── parcelRoutes.js
├── rules/               # Extensible Rule Engine
│   ├── operators.js     # Registry mapping operator strings to logic
│   └── ruleEngine.js    # Rule matching and conditional evaluation engine
├── services/            # Business Logic layer (coordinates routing pipeline)
│   └── routingService.js
├── validators/          # Input schema validators (Joi structures)
│   ├── parcelValidator.js
│   └── ruleValidator.js
├── app.js               # Express application setups & security middleware config
└── index.js             # Entry point (validates rules, connects DB, starts server)
```

---

## 🔄 Request Execution Flow

When a client hits an endpoint (e.g., submitting a parcel via `POST /api/parcels/route`), the request flows sequentially through the following layers:

```
┌─────────────────┐
│     Client      │
└────────┬────────┘
         │
         │  1. HTTP POST Payload
         ▼
┌─────────────────┐
│   app.js        │ ◄── [Security & Sentry Middlewares]
└────────┬────────┘
         │
         │  2. Hits Route Definition
         ▼
┌─────────────────┐
│   routes/       │
│  (parcelRoutes) │ ◄── [Joi validate() Middleware runs first]
└────────┬────────┘
         │
         │  3. Validated payload sent
         ▼
┌─────────────────┐
│  controllers/   │
│(parcelController)│ ◄── [Extracts body, calls service layer]
└────────┬────────┘
         │
         │  4. Business logic invocation
         ▼
┌─────────────────┐      ┌───────────────┐
│   services/     │ ───► │    rules/     │  ◄── Evaluates weight & value
│(routingService) │ ◄─── │ (ruleEngine)  │      against loaded config
└────────┬────────┘      └───────────────┘
         │
         │  5. Persist records
         ▼
┌─────────────────┐
│  repositories/  │ ───► [ Mongoose Models (models/) ]
│ (parcelRepos)   │ ───► [ Writes to MongoDB Database ]
└────────┬────────┘
         │
         │  6. Return saved document
         ▼
┌─────────────────┐
│  controllers/   │
│(parcelController)│
└────────┬────────┘
         │
         │  7. Sends 201 Created HTTP Response
         ▼
┌─────────────────┐
│     Client      │
└─────────────────┘
```

---

## 🧩 Architectural Layers in Detail

### 1. Entry Point (`index.js` & `app.js`)
*   **`index.js`** handles boot-up operations. It loads environment variables, validates the `rules.json` configuration at startup (so the server crashes instantly if rules are corrupted), connects to MongoDB, and registers graceful shutdown hooks to release DB resources safely.
*   **`app.js`** registers Express security middlewares (Helmet, CORS, rate limits) and sets up Sentry monitoring.

### 2. Request Validation (`validators/` & `middleware/`)
*   Incoming payloads are filtered by Joi schemas defined in `validators/`.
*   The `validate()` middleware intercepts the payload. If the data is invalid, it responds with `400 Bad Request` immediately, preventing invalid requests from ever hitting controllers.

### 3. Controller Layer (`controllers/`)
*   Controllers are responsible only for standard Web operations. They do not know *how* parcels are routed or *where* they are saved.
*   They call the service layer and convert service responses into JSON format.

### 4. Service Layer (`services/`)
*   This acts as the orchestrator.
*   It passes the parcel payload to the **Rule Engine**, saves the resolved output to the database via **Repositories**, and schedules **Audit Logs**.

### 5. Repository Layer (`repositories/` & `models/`)
*   Encapsulates all database operations. Services never call `Mongoose` queries directly. Instead, they interact with clean functions (e.g., `parcelRepository.create()`, `parcelRepository.countByStatus()`).
*   This ensures that the database implementation can be swapped (e.g., Mongo to SQL) by rewriting only the repository files.

### 6. Rule Engine (`rules/`)
*   Processes condition checks. It maps the dynamic parameters in `rules.json` to Javascript functions via `operators.js` (e.g., checking if `value` is `greater_than` `1000`).
*   Rules are evaluated sequentially based on their `priority` score. The first matching rule returns the assigned routing action.
