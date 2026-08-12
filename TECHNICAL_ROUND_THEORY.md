# Technical Round Theory Notes

This project is a Parcel Routing System built with React on the frontend and Node.js/Express with MongoDB on the backend. The core idea is a configurable rule engine that routes parcels by weight, declared value, and destination country without hardcoded if-else chains.

## 1. Authentication

The backend authentication is a simple demo Bearer-token flow, not a full JWT refresh-token implementation.

- Login endpoint: `POST /api/auth/login`
- Demo credentials: `admin / admin123`
- Successful login returns a fixed token: `demo-routing-token-xyz`
- The frontend stores it in `localStorage` under `routing_app_token`
- Protected API routes check for `Authorization: Bearer demo-routing-token-xyz`

### Access token

The access token is the Bearer token returned after login. It is used by the frontend Axios interceptor and sent with every protected request.

### Refresh token

There is no refresh-token flow in this codebase. If asked, say the project currently uses a short demo session token only, and a refresh-token mechanism would be a future enhancement for production.

## 2. Model Schema Definition

### Parcel model

The `Parcel` schema stores:

- `weight`: number, required, min 0
- `value`: number, required, min 0
- `destinationCountry`: string, required, trimmed
- `department`: string, optional, default `null`
- `status`: enum of `ROUTED` or `PENDING_INSURANCE_APPROVAL`
- `matchedRule`: string, optional, default `null`
- timestamps: `createdAt` is enabled

### Audit log model

The `AuditLog` schema stores:

- `parcelId`: optional ObjectId reference to `Parcel`
- `action`: string, required
- `timestamp`: date, defaults to now
- `details`: mixed object for metadata

## 3. Backend Architecture

The backend is layered:

- `src/index.js`: startup, rules validation, DB connection, server boot
- `src/app.js`: Express app setup, middleware registration, routes, error handling
- `src/routes/`: maps HTTP endpoints to controllers
- `src/controllers/`: HTTP request/response handling only
- `src/services/`: business logic orchestration
- `src/rules/`: rule engine and operator registry
- `src/repositories/`: database operations
- `src/models/`: Mongoose schemas
- `src/validators/`: Joi request/config validation
- `src/middleware/`: auth, validation, centralized error handling
- `src/config/`: DB, logger, rules, Sentry configuration

### Why this architecture works

- Controllers stay thin
- Business logic lives in services
- Database queries are isolated in repositories
- Routing rules are configurable from JSON
- Validation is done before business logic runs

## 4. File Flow: Frontend to Backend

### Single parcel flow

1. User enters parcel data in `frontend/src/pages/SingleRoute.jsx`
2. Form validation runs in React Hook Form
3. `frontend/src/services/api.js` sends `POST /api/parcels/route`
4. Axios interceptor attaches the access token from localStorage
5. `backend/src/middleware/auth.js` checks the Bearer token
6. `backend/src/middleware/validate.js` validates the payload with Joi
7. `backend/src/controllers/parcelController.js` calls the service
8. `backend/src/services/routingService.js` evaluates rules
9. `backend/src/repositories/parcelRepository.js` saves the parcel
10. `backend/src/repositories/auditLogRepository.js` stores the audit log
11. Response returns to frontend and UI shows the result

### Batch flow

1. User uploads a JSON file in `frontend/src/pages/BatchUpload.jsx`
2. Frontend checks file type and parses JSON
3. `routeBatch()` sends the array to `POST /api/parcels/batch`
4. Backend validates the array with Joi
5. Service processes each parcel one by one
6. Each item returns success or failure in the batch result

## 5. Middleware Working

### `auth.js`

- Checks for `Authorization` header
- Requires the `Bearer ` prefix
- Accepts only the demo token `demo-routing-token-xyz`
- Returns `401` if missing or invalid

### `validate.js`

- Runs Joi validation on `req.body`
- Rejects unknown fields
- Collects all validation errors at once
- Stores cleaned data in `req.validatedBody`

### `errorHandler.js`

- Catches all unhandled errors passed via `next(err)`
- Logs the error using Winston
- Captures errors in Sentry if configured
- Returns a sanitized error response to the client

## 6. Rule Engine Logic

The rule engine is based on priorities and conditions.

- Rules are loaded from `backend/src/config/rules.json`
- `RuleRegistry.loadRules()` converts JSON rules into executable rule objects
- Rules are sorted by priority descending
- `matchRule()` returns the first rule whose conditions all pass
- Operators are handled by `src/rules/operators.js`

### Current routing rules

- `value > 1000` -> insurance approval
- `weight <= 1` -> Mail Department
- `weight <= 10` -> Regular Department
- `weight > 10` -> Heavy Department

### Important behavior

The insurance rule has the highest priority, so it overrides weight-based routing.

## 7. Test Cases

The tests cover three areas:

- Rule engine boundary checks
- Configuration validation
- API endpoint behavior

### Examples from the current tests

- `0.5 kg` routes to Mail Department
- `1.0 kg` still routes to Mail Department
- `10.0 kg` routes to Regular Department
- `10.1 kg` routes to Heavy Department
- `value > 1000` returns `PENDING_INSURANCE_APPROVAL`
- invalid rule configs are rejected
- auth blocks missing or invalid tokens
- login succeeds only for the demo credentials

## 8. Dependencies and Why They Exist

### Backend dependencies

- `express`: HTTP server and routing
- `mongoose`: MongoDB object modeling
- `joi`: request and config validation
- `cors`: frontend/backend cross-origin support
- `helmet`: security headers
- `express-rate-limit`: request throttling
- `dotenv`: environment variables
- `winston`: structured logging
- `@sentry/node`: error monitoring
- `jest` and `supertest`: test framework and API testing

### Frontend dependencies

- `react` and `react-dom`: UI framework
- `axios`: API calls
- `react-hook-form`: form state and validation
- `framer-motion`: animations and transitions
- `react-icons`: visual icon set
- `vite`: fast dev server and build tool

## 9. UI/UX Decision Process

The UI is designed like a control console rather than a generic dashboard.

- Strong contrast and structured cards make routing results easy to scan
- Motion is used for booting, page transitions, and drill-down feedback
- The login screen is intentionally simple because authentication is only a gate to the console
- Dashboard cards focus on operational metrics, not decorative charts
- Batch upload uses drag-and-drop because the workflow is file-driven
- Single route form is minimal because it should feel quick and transactional

## 10. Frontend API Layer

The API layer lives in `frontend/src/services/api.js`.

- `loginUser()` calls `/api/auth/login`
- `routeSingle()` calls `/api/parcels/route`
- `routeBatch()` calls `/api/parcels/batch`
- `getStats()` calls `/api/parcels/stats`
- `getParcels()` calls `/api/parcels`
- `getErrors()` calls `/api/parcels/errors`
- `resetStats()` calls `/api/parcels/reset`

### API behavior

- Axios base URL is configured from `VITE_API_BASE_URL`
- A request interceptor injects the Bearer token automatically
- This keeps auth logic centralized instead of repeating it in every page

## 11. What to Say in the Interview

If asked to summarize the project, say:

"This is a MERN-based parcel routing system where parcels are routed by a configurable rule engine. The backend uses a layered architecture with controllers, services, repositories, validators, and middleware. Authentication is demo Bearer-token based, routing rules are stored in JSON and validated at startup, and the frontend talks to the backend through a centralized Axios API layer."

## 12. Likely Questions You Can Expect

- What is the difference between the access token and refresh token in your app?
- Why did you use a rule engine instead of hardcoded conditions?
- How does the request travel from frontend to backend?
- What does each middleware do?
- Why did you split controllers, services, and repositories?
- What are the important validations in the system?
- How does priority affect rule matching?
- Why is insurance approval overriding weight-based routing?
- What happens if the rules JSON is invalid at startup?
- How do the tests protect against regression?
- Why did you choose these frontend dependencies?
- How is the batch upload validated and processed?

## 13. Important Honest Answer

If someone asks about refresh tokens or production-grade auth, be direct: this project currently uses a demo Bearer token only. A refresh-token flow was not implemented, because the focus of the project is routing logic, validation, and layered backend design.