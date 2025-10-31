# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack web application for mapping and connecting community centers in Kampala, Uganda. The platform enables role-based access, real-time messaging between centers, and comprehensive management of community center information.

## Project Structure

**Monorepo Layout**: Frontend at project root, Go backend in subdirectory:

```
CommunityCentresPlatform/
├── components/           # React UI components (Radix UI + shadcn/ui)
├── contexts/            # React Context providers (AuthContext, etc.)
├── services/            # Frontend services (api.ts, events.ts for SSE)
├── styles/              # Global CSS and Tailwind config
├── utils/               # Frontend utility functions
├── App.tsx              # Main React application entry point
├── vite.config.ts       # Vite build configuration
├── vercel.json          # Vercel deployment configuration (frontend-only)
└── go-backend/          # ✅ Production Go backend (deployed separately to Railway)
    ├── cmd/server/      # Go application entry point
    ├── internal/        # Go internal packages
    │   ├── auth/        # JWT authentication
    │   ├── db/          # Database models (GORM)
    │   ├── events/      # SSE broker
    │   ├── http/        # HTTP handlers and routes
    │   └── realtime/    # Real-time room management
    └── Dockerfile       # Production Docker image
```

**Important**: Frontend and backend are deployed separately - Vercel for frontend, Railway for backend.

## Architecture Overview

### Frontend (React + TypeScript)
- **Main App**: [App.tsx](App.tsx) - Central application with view routing and state management
- **Authentication**: Context-based auth with JWT tokens via [contexts/AuthContext.tsx](contexts/AuthContext.tsx)
- **Theme Management**: Dark/light mode via [contexts/ThemeContext.tsx](contexts/ThemeContext.tsx) with localStorage persistence
- **API Layer**: Centralized service in [services/api.ts](services/api.ts) with typed endpoints
- **Real-time**: SSE-based client in [services/events.ts](services/events.ts) for live updates (replaces Socket.io)
- **UI Components**: Radix UI components in `components/ui/` with Tailwind CSS v3 styling
- **Skeleton Loaders**: Professional loading states in `components/skeletons/` (MapSkeleton, CenterCardSkeleton, StatCardSkeleton)
- **Build System**: Vite with TypeScript, configured in [vite.config.ts](vite.config.ts)

### Backend Architecture

**Production Backend**: Go (Gin framework) with GORM ORM and PostgreSQL
- Location: `go-backend/` directory
- Features: JWT auth, RESTful API, SSE real-time events
- Deployment: Railway with PostgreSQL addon
- Database: PostgreSQL (Railway managed service)

### Key Data Models (Go Backend)

- **User**: Authentication with role-based access (ADMIN, CENTER_MANAGER, VISITOR, ENTREPRENEUR)
- **CommunityCenter**: Center data with coordinates, services, verification status
- **Connection**: Bidirectional relationships between centers with collaboration types and descriptions
- **MessageThread/CenterMessage**: Real-time messaging system between verified centers
- **ContactMessage**: Public inquiry system for visitors to contact centers
- **Entrepreneur**: Business profiles linked to ENTREPRENEUR role users with verification status
- **HubEnrollment**: Tracks entrepreneur enrollment in community centers with status (ACTIVE, COMPLETED, SUSPENDED, PENDING)
- **ServiceProvision**: Logs service delivery from hubs to entrepreneurs, including hub collaborations and investor metadata

## Project Status

### Completed Features (Phase B + Phase A1)

**Phase B - UI/UX Enhancements** ✅ COMPLETE:

- Dark mode implementation with system preference detection and localStorage persistence
- Enhanced CenterCard component with gradients, animations, and verified badges
- Skeleton loaders for professional loading states (Map, CenterCard, StatCard)
- Touch-optimized mobile interactions with active states
- Full keyboard navigation and ARIA accessibility
- Shimmer effects and scale animations on hover/active
- Responsive grid layouts with flexible spacing

**Phase A1 - Database Schema Extensions** ✅ COMPLETE:

- Added ENTREPRENEUR role to User model
- Created Entrepreneur model (business profiles with verification)
- Created HubEnrollment model (enrollment tracking with statuses)
- Created ServiceProvision model (service delivery logs with hub collaborations and investor metadata)
- Enhanced Connection model with CollaborationType, CollaborationDescription, and Active fields
- Added EnrollmentStatus enum (ACTIVE, COMPLETED, SUSPENDED, PENDING)
- Added ServiceProvisionStatus enum (PENDING, ACTIVE, COMPLETED, CANCELLED)

**Phase A2-A6 - Entrepreneur Features** ✅ COMPLETE:

**Backend (Go):**
- entrepreneurs.go - Full CRUD + verification endpoint (CREATE, GET, UPDATE, DELETE, LIST, VERIFY)
- enrollments.go - Enrollment management (CREATE, GET by hub/entrepreneur, UPDATE status)
- services.go - Service provision tracking (CREATE, GET by hub/entrepreneur, UPDATE)
- All routes registered in routes.go with proper auth middleware

**Frontend Services:**
- services/entrepreneur.ts - Complete entrepreneur API client
- services/enrollment.ts - Complete enrollment API client
- services/serviceProvision.ts - Complete service provision API client
- src/types/entrepreneur.ts - Full TypeScript interfaces

**Frontend Components:**
- components/entrepreneur/EntrepreneurRegistrationForm.tsx - Business profile creation
- components/entrepreneur/EntrepreneurProfile.tsx - Profile view/edit
- components/entrepreneur/EntrepreneurDashboard.tsx - Dashboard with enrollments and services
- components/auth/RegisterForm.tsx - Updated with ENTREPRENEUR role option
- App.tsx - Entrepreneur routing fully integrated
- Navigation.tsx - Entrepreneur menu items and navigation

**Features:**
- Entrepreneurs can register with business profiles
- Hub managers can enroll entrepreneurs in programs
- Service provision logging with hub collaborations and investor metadata
- Profile verification by admins
- Complete CRUD operations for all entrepreneur-related entities

**Google OAuth SSO** ✅ COMPLETE:

**Backend (Go):**
- go-backend/internal/auth/google.go - Google token verification utility
- go-backend/internal/http/handlers/auth.go - GoogleVerify handler
- go-backend/internal/db/models.go - Added GoogleID, PictureURL, AuthProvider fields to User model
- go-backend/internal/config/config.go - Added GoogleClientID configuration
- POST /api/auth/google/verify endpoint registered and working

**Frontend (React):**
- Installed @react-oauth/google package
- components/auth/GoogleLoginButton.tsx - Google Sign-In button component
- components/auth/LoginForm.tsx - Integrated Google button with "OR" divider
- contexts/AuthContext.tsx - Added loginWithGoogle method
- services/api.ts - Added loginWithGoogle API method
- App.tsx - Wrapped with GoogleOAuthProvider

**Features:**
- Users can sign in/register with Google accounts
- Automatic account linking by email
- Google profile picture integration
- Credential flow (no page redirects, modal-friendly)
- Dark mode compatible Google button
- Environment variables configured in .env.example files

**Setup Requirements:**
1. Create OAuth 2.0 Client ID in Google Cloud Console
2. Add authorized JavaScript origins (localhost, Vercel domain)
3. Set VITE_GOOGLE_CLIENT_ID in frontend environment
4. Set GOOGLE_CLIENT_ID in backend environment
5. Enable: Maps JavaScript API, Places API, Geocoding API (already done for Google Maps)

### Pending Work

**Phase C - Real-time Enhancements** ⏳ NOT STARTED:

- Notification system (database table, backend endpoints, frontend components)
- Enhanced messaging (typing indicators, online status)
- New SSE events (enrollment updates, service provision updates, collaboration notifications)

**Deployment - Railway + Vercel + cPanel** ✅ COMPLETE:

- ✅ Railway backend deployment with PostgreSQL addon
- ✅ Vercel frontend deployment (auto-deploys from GitHub)
- ✅ Custom domain: centres.kii-impact.org
- ✅ Environment variables configured
- ✅ Production site live at https://centres.kii-impact.org

## Essential Commands

### Frontend Development (Root Directory)
```bash
npm install              # Install frontend dependencies
npm run dev              # Start Vite dev server on http://localhost:3000
npm run build            # Build frontend for production (outputs to dist/)
npm run build:production # Build with production environment variables
npm run preview          # Preview production build locally
npm run lint             # Run ESLint with auto-fix
npm run type-check       # TypeScript type checking without emit
```

### Go Backend (go-backend/ Directory)
```bash
cd go-backend

# Development
go mod download          # Download Go dependencies
go run cmd/server/main.go  # Start dev server on http://localhost:8080

# Production Build
go build -o bin/server ./cmd/server  # Build production binary
./bin/server              # Run production server

# Docker (Local Development)
docker-compose up -d      # Start backend + PostgreSQL in Docker
docker-compose down       # Stop Docker containers

# Testing
go test ./...             # Run all Go tests
go test -v ./internal/... # Run tests with verbose output
```

### Database Setup (Go Backend - GORM)
```bash
# GORM auto-migrates on startup in development
# For production, create explicit migration files

# Initial setup
cd go-backend
cp .env.example .env      # Configure DATABASE_URL and JWT_SECRET
# Edit .env with your PostgreSQL connection string

# The server will auto-create tables on first run (development only)
go run cmd/server/main.go
```

### Default Test Credentials (After Database Seeding)

- **Administrator**: `admin@test.com` / `admin123`
- **Center Manager**: `manager@test.com` / `admin123`
- **Entrepreneur**: (To be created after Phase A2-A6 implementation)

## Environment Configuration

### Initial Setup Steps

1. **Generate a Secure JWT Secret**:
```bash
# Generate a secure base64-encoded secret (32 bytes)
openssl rand -base64 32
# Example output: RYmSUSFFOIPU+v/GndHvyxQpltIyf2SfG+M8uh+Rumc=
```

2. **Set Up PostgreSQL Database**:
```bash
# Option 1: Local PostgreSQL installation
createdb kampala_centers

# Option 2: Use Docker (recommended for development)
cd go-backend
docker-compose up -d db  # Starts PostgreSQL on port 5432
```

### Frontend Environment (.env in project root)
```env
# Development (.env)
VITE_API_URL="http://localhost:8080/api"

# Production (.env.production)
# Update with your Railway backend URL before deploying to Vercel
VITE_API_URL="https://your-railway-backend.up.railway.app/api"
NODE_ENV="production"
```

**Note**: Vercel automatically uses `.env.production` when building. Alternatively, set `VITE_API_URL` in Vercel dashboard under project settings → Environment Variables.

### Go Backend Environment (go-backend/.env)
```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/kampala_centers"
# Production example: postgresql://user:pass@rds.amazonaws.com:5432/kampala_centers

# JWT Configuration (use the generated secret from step 1)
JWT_SECRET="RYmSUSFFOIPU+v/GndHvyxQpltIyf2SfG+M8uh+Rumc="
JWT_EXPIRES_IN="168h"  # 7 days in Go duration format

# Server Configuration
PORT=8080
GIN_MODE="debug"  # Use "release" in production

# CORS - Frontend URL for cross-origin requests
FRONTEND_URL="http://localhost:3000"
# Production: Update to your deployed frontend domain
# FRONTEND_URL="https://your-frontend-domain.com"
```

### Environment File Setup
```bash
# Frontend
cp .env.example .env
# Edit .env and set VITE_API_URL

# Go Backend
cd go-backend
cp .env.example .env
# Edit .env and set:
# 1. DATABASE_URL to your PostgreSQL connection
# 2. JWT_SECRET to your generated secret
# 3. FRONTEND_URL to your frontend URL (for CORS)
```

**Production Security**:
- Never commit `.env` files to version control
- Use environment variables or secrets managers (AWS Secrets Manager, etc.)
- Ensure `JWT_SECRET` is different between development and production
- Use SSL/TLS for database connections in production

## Development Workflow

### Quick Start (Recommended)

1. **Clone and Install**:
```bash
git clone <repository-url>
cd CommunityCentresPlatform
npm install  # Frontend dependencies only
```

2. **Set Up Go Backend**:
```bash
cd go-backend
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Start PostgreSQL (using Docker)
docker-compose up -d db

# Start Go backend
go run cmd/server/main.go
# Backend runs on http://localhost:8080
```

3. **Set Up Frontend** (in a new terminal):
```bash
# In project root
cp .env.example .env
# Edit .env: VITE_API_URL="http://localhost:8080/api"

npm run dev:frontend
# Frontend runs on http://localhost:3000
```

4. **Access the Application**:
- Open `http://localhost:3000`
- Login with test credentials (if database is seeded)

### Development Tips

**Hot Reload**:
- Frontend: Vite auto-reloads on file changes
- Go Backend: Use `air` for hot reload or restart manually after changes

**API Testing**:
```bash
# Test health endpoint
curl http://localhost:8080/healthz

# Test authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

**Common Development Tasks**:
- Add new API endpoint: See "Adding a New API Endpoint" section below
- Modify database schema: Update `go-backend/internal/db/models.go`, restart server for auto-migration
- Add new React component: Create in `components/` and import in `App.tsx`
- Add real-time feature: Use SSE events in `go-backend/internal/events/` and subscribe in `services/events.ts`

### UI/UX Enhancement Details (Phase B - Completed)

**Dark Mode Implementation**:

- [contexts/ThemeContext.tsx](contexts/ThemeContext.tsx) - Theme provider with localStorage persistence and system preference detection
- [components/ThemeToggle.tsx](components/ThemeToggle.tsx) - Sun/moon icon toggle button with smooth transitions
- [styles/globals.css](styles/globals.css) - CSS variables for light/dark color schemes
- [tailwind.config.js](tailwind.config.js) - Configured with `darkMode: 'class'` strategy

**Skeleton Loaders**:

- [components/skeletons/MapSkeleton.tsx](components/skeletons/MapSkeleton.tsx) - Map loading with grid pattern and shimmer effect
- [components/skeletons/CenterCardSkeleton.tsx](components/skeletons/CenterCardSkeleton.tsx) - Card skeleton matching real card layout
- [components/skeletons/StatCardSkeleton.tsx](components/skeletons/StatCardSkeleton.tsx) - Dashboard stat card loading state

**Enhanced CenterCard**:

- Gradient backgrounds based on verification status (green for verified, blue for admin-added, gray for pending)
- Animated verified badge with CheckCircle icon
- Shimmer effect on hover using CSS transforms
- Touch-optimized with `active:scale-[0.98]` for mobile tap feedback
- Full keyboard navigation with `role="button"`, `tabIndex`, and Enter/Space key handlers
- Connection indicators showing entrepreneur associations
- Responsive badges for services with "+N more" overflow handling

**Design System Updates**:

- Extended color palette with gradient presets (blue, purple, green, orange)
- Custom animations: shimmer, fade-in, slide-in-right, scale-in, pulse-slow
- Responsive spacing and flexible grids (1 col mobile → 2 col tablet → 3 col desktop)
- Dark mode support throughout all components

### Known Issues in Codebase

**Bug in AuthContext.tsx (Line 100)**:
The register function references `socketService` instead of `eventsService`. This should be:
```typescript
// INCORRECT (line 100):
await socketService.connect(token);

// CORRECT:
await eventsService.connect();
```

This bug doesn't prevent registration but may cause SSE connection issues after registration.

## Authentication Flow

The app uses a centralized authentication pattern:
1. [AuthContext.tsx](contexts/AuthContext.tsx) manages global auth state
2. JWT tokens stored in localStorage with automatic refresh
3. [services/api.ts](services/api.ts) handles token attachment to requests
4. SSE connections authenticated with same JWT token (via query parameter or Authorization header)
5. Role-based UI rendering and API endpoint protection

## Real-time Features Architecture

**SSE-based real-time updates** managed through [services/events.ts](services/events.ts):
- **Connection**: EventSource connects to `/api/events` endpoint with JWT token
- **Messages**: Real-time delivery of center-to-center messages via SSE
- **Updates**: Live center verification and connection status changes
- **Notifications**: Admin notifications for contact messages
- **Room Management**: Join/leave rooms via REST endpoints (`/api/realtime/join-center`, etc.)

**Important**: This application uses SSE (Server-Sent Events) instead of Socket.io for real-time features. The SSE connection is unidirectional (server → client), while client actions (join room, typing indicators) use REST POST endpoints.

## State Management Pattern

The app uses React Context + hooks pattern:
- **AuthContext**: Global authentication state
- **Component State**: Local state with useState for UI interactions
- **API State**: Server sync via `apiService` with optimistic updates
- **Real-time Sync**: SSE events update local state automatically

## Key Integration Points

1. **Authentication Flow**: `AuthContext` → `apiService` → `eventsService`
2. **Data Flow**: UI Components → `apiService` → Backend API (Go) → Database
3. **Real-time Updates**: SSE → `eventsService` → Component State Updates → UI Re-render
4. **Role-Based Access**: `AuthContext` roles control component rendering and API access

## Deployment Options

### Planned Deployment: Railway + Vercel → kii-impact.org/centres

**Target Architecture**:

- **Backend**: Railway with PostgreSQL addon
- **Frontend**: Vercel (deployed from GitHub)
- **Domain**: kii-impact.org/centres (subdirectory, not subdomain)
- **DNS**: cPanel DNS configuration with CNAME or proxy rules

**Deployment Steps**:

1. **Railway Backend Deployment**:
   ```bash
   cd go-backend
   # Railway will auto-detect Dockerfile and deploy
   # Add PostgreSQL addon in Railway dashboard
   # Set environment variables:
   # - DATABASE_URL (from Railway PostgreSQL addon)
   # - JWT_SECRET (generate with: openssl rand -base64 32)
   # - FRONTEND_URL (Vercel URL or custom domain)
   # - PORT=8080
   # - GIN_MODE=release
   ```

2. **Vercel Frontend Deployment**:
   ```bash
   # Option 1: Connect GitHub repository in Vercel dashboard (recommended)
   # - Vercel auto-detects Vite and uses vercel.json configuration
   # - Set environment variable: VITE_API_URL=<Railway backend URL>/api
   # - Deploy!

   # Option 2: Vercel CLI (manual deployment)
   npm install -g vercel
   vercel --prod
   ```

3. **Post-Deployment Configuration**:
   - Update `.env.production` with Railway backend URL
   - In Vercel dashboard: Set `VITE_API_URL` environment variable
   - In Railway dashboard: Set `FRONTEND_URL` to Vercel URL (for CORS)
   - Test: Visit Vercel URL and verify API connection

4. **cPanel DNS Configuration** (Optional - for custom domain):
   - Option A: CNAME record pointing `centres.kii-impact.org` to Vercel
   - Option B: Reverse proxy rule in `.htaccess` routing `/centres/*` to Vercel
   - Ensure HTTPS is configured (domain already has SSL)

**Troubleshooting Vercel Deployment**:

If you encounter Prisma errors during Vercel build:
- Ensure `package.json` contains NO Prisma dependencies (`@prisma/client`, `prisma`)
- Verify `vercel.json` exists with explicit Vite configuration
- Check `.vercelignore` excludes `backend/`, `go-backend/`, `prisma/`
- Confirm build command is `npm run build` (not custom scripts)

If API requests fail in production:
- Verify `VITE_API_URL` environment variable is set in Vercel dashboard
- Check Railway backend is running (visit Railway URL + `/healthz`)
- Ensure Railway `FRONTEND_URL` matches your Vercel deployment URL
- Check browser console for CORS errors

### Alternative Deployment Options

#### AWS ECS Fargate

See detailed guide: [AWS-DEPLOYMENT.md](AWS-DEPLOYMENT.md)

**Quick Start:**
```bash
cd go-backend
# 1. Setup AWS infrastructure (one-time)
./setup-aws-infrastructure.sh

# 2. Deploy
./deploy-aws.sh production
```

**Architecture:**
- **Compute**: ECS Fargate (serverless containers)
- **Database**: RDS PostgreSQL
- **Storage**: ECR (Docker images)
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch Logs
- **Load Balancer**: Application Load Balancer

**Cost**: ~$30-50/month (2 vCPU, 4GB RAM, minimal traffic)

**SSE Configuration**: Ensure ALB idle timeout is set to 60+ seconds for SSE connections.

#### Docker Compose (Local Development)
```bash
cd go-backend
docker-compose up -d
```

#### cPanel Deployment
See detailed guide: [DEPLOYMENT.md](DEPLOYMENT.md)

**Note**: cPanel deployment requires SSH access to run Go binary as persistent process. Many shared hosting providers don't support this - consider VPS or cloud hosting instead.

#### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string for JWT signing (base64-encoded)
- `JWT_EXPIRES_IN` - Token expiration (e.g., "168h" for 7 days)
- `FRONTEND_URL` - Your frontend domain for CORS
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment ("development" or "production")

## Entrepreneur Features Architecture (Phase A2-A6)

### Overview

The entrepreneur features extend the platform to support a fourth user role (ENTREPRENEUR) with the following capabilities:

- **Entrepreneur Registration**: Public registration form with business profile creation
- **Hub Enrollments**: Community centers can enroll entrepreneurs in their programs
- **Service Provisions**: Track services delivered from hubs to entrepreneurs, including:
  - Direct hub-to-entrepreneur services
  - Multi-hub collaborations serving entrepreneurs
  - Investor involvement (metadata only, no login accounts)
- **Hub Collaborations**: Enhanced connection model showing collaboration types and descriptions

### Data Model Relationships

```text
User (ENTREPRENEUR role)
  └─→ Entrepreneur (business profile)
       ├─→ HubEnrollment[] (enrollments in community centers)
       │    └─→ CommunityCenter (the hub)
       └─→ ServiceProvision[] (services received)
            ├─→ CommunityCenter (primary hub providing service)
            ├─→ CommunityCenter (optional collaborating hub)
            └─→ Investor metadata (name, details - text fields only)

CommunityCenter
  ├─→ Connection[] (enhanced with collaboration types)
  ├─→ HubEnrollment[] (entrepreneurs enrolled)
  └─→ ServiceProvision[] (services provided to entrepreneurs)
```

### Pending Implementation (Phase A2-A6)

**Backend (Go)** - `go-backend/internal/http/handlers/`:

1. **entrepreneurs.go**: CRUD operations for entrepreneur profiles
   - `POST /api/entrepreneurs` - Create entrepreneur profile (requires ENTREPRENEUR role)
   - `GET /api/entrepreneurs/:id` - Get entrepreneur details
   - `PUT /api/entrepreneurs/:id` - Update entrepreneur profile
   - `DELETE /api/entrepreneurs/:id` - Delete entrepreneur profile

2. **enrollments.go**: Hub enrollment management
   - `POST /api/enrollments` - Create enrollment (CENTER_MANAGER or ADMIN)
   - `GET /api/enrollments/hub/:hubId` - List enrollments for a hub
   - `GET /api/enrollments/entrepreneur/:entrepreneurId` - List entrepreneur's enrollments
   - `PUT /api/enrollments/:id` - Update enrollment status

3. **services.go**: Service provision tracking
   - `POST /api/services` - Log service provision (CENTER_MANAGER or ADMIN)
   - `GET /api/services/hub/:hubId` - List services provided by hub
   - `GET /api/services/entrepreneur/:entrepreneurId` - List services received by entrepreneur
   - `PUT /api/services/:id` - Update service provision status

4. **centers.go updates**: Add investor management endpoints
   - `POST /api/centers/:id/investors` - Add investor metadata to hub
   - `GET /api/centers/:id/investors` - List hub's investors
   - `PUT /api/centers/:id/investors/:investorId` - Update investor info
   - `DELETE /api/centers/:id/investors/:investorId` - Remove investor

**Frontend (React)** - Components to create:

1. **EntrepreneurRegistrationForm.tsx**: Public registration with business details
2. **EntrepreneurProfile.tsx**: Profile view/edit for logged-in entrepreneurs
3. **EntrepreneurDashboard.tsx**: Dashboard showing enrollments and services received
4. **HubEnrollmentsManager.tsx**: Hub view to manage entrepreneur enrollments
5. **ServiceProvisionsManager.tsx**: Hub view to log and track services delivered
6. **InvestorSection.tsx**: Component within CenterDetail to show/manage investors
7. **CollaborationManager.tsx**: Enhanced connection management with collaboration types

**Frontend Services** - API clients to create:

1. **services/entrepreneur.ts**: Entrepreneur profile API calls
2. **services/enrollment.ts**: Enrollment management API calls
3. **services/services.ts**: Service provision API calls (note naming collision with folder)

**Integration Points**:

- Update [components/auth/RegisterForm.tsx](components/auth/RegisterForm.tsx) with role selector (VISITOR vs ENTREPRENEUR)
- Update [components/CommunityCenter.tsx](components/CommunityCenter.tsx) with 4 new sections:
  - Enrolled Entrepreneurs list
  - Services Provided log
  - Investor information
  - Collaboration details (enhanced from existing connections)
- Update [App.tsx](App.tsx) routing to handle entrepreneur dashboard view

## Common Development Tasks

### Adding a New API Endpoint
1. Add handler in `go-backend/internal/http/handlers/`
2. Register route in `go-backend/internal/http/routes.go`
3. Add method to [services/api.ts](services/api.ts) with proper typing
4. Update component to use new API method
5. Consider real-time updates via SSE if needed

### Database Schema Changes (Go Backend)
1. Update models in `go-backend/internal/db/models.go`
2. Run server - GORM will auto-migrate on startup (development only)
3. For production migrations, create explicit migration SQL files
4. Update TypeScript interfaces in frontend to match new schema

### Adding Real-time Features (SSE)
1. Add event emission in `go-backend/internal/events/broker.go`
2. Emit events from API handlers using `broker.Publish()`
3. Add event listeners in [services/events.ts](services/events.ts)
4. Update component state on SSE events received

**Example SSE workflow:**
1. User action triggers REST POST to `/api/realtime/join-center`
2. Server adds client to room/channel
3. Server-side events are published to room via `broker.Publish("center:123", event)`
4. SSE connection receives event and dispatches to subscribers
5. Component updates UI based on event payload

## Security Considerations

- JWT tokens have configurable expiration (default: 7 days)
- All API endpoints require authentication except health checks
- Rate limiting on all `/api` endpoints (configurable in middleware)
- CORS configured for specific frontend URL
- Security headers enabled via Gin middleware
- Input validation using Go validator
- Password hashing with bcrypt
- SSE connections authenticated via JWT token

## Testing Notes

The codebase includes test files for Go backend:
- Unit tests: `*_test.go` files throughout `go-backend/` directory
- Run tests: `cd go-backend && go test ./...`

Frontend tests not yet implemented. When adding:
- Frontend: Consider Vitest + React Testing Library
- E2E: Consider Playwright for full-stack testing

## Troubleshooting

### Frontend Issues

**Problem**: "Network Error" or "Failed to fetch" when calling API
- **Cause**: Backend not running or CORS misconfiguration
- **Solution**:
  1. Verify Go backend is running on port 8080: `curl http://localhost:8080/healthz`
  2. Check `VITE_API_URL` in frontend `.env` matches backend URL
  3. Verify `FRONTEND_URL` in Go backend `.env` matches frontend URL (e.g., `http://localhost:3000`)
  4. Check browser console for CORS errors

**Problem**: "401 Unauthorized" on authenticated routes
- **Cause**: Invalid or expired JWT token
- **Solution**:
  1. Clear localStorage: `localStorage.clear()` in browser console
  2. Logout and login again
  3. Verify `JWT_SECRET` is the same in backend `.env` (backend may have restarted with different secret)

**Problem**: Real-time updates (SSE) not working
- **Cause**: SSE connection failed or not established
- **Solution**:
  1. Check browser Network tab for `/api/events` connection (should stay open)
  2. Verify JWT token is valid
  3. Check `eventsService.isConnected()` returns true in console
  4. Known bug: `AuthContext.tsx` line 100 references wrong service (see "Known Issues")

### Backend Issues

**Problem**: Go backend fails to start with "connection refused" database error
- **Cause**: PostgreSQL not running or wrong connection string
- **Solution**:
  1. Start PostgreSQL: `docker-compose up -d db` (or start local PostgreSQL)
  2. Verify `DATABASE_URL` in `go-backend/.env` is correct
  3. Test connection: `psql postgresql://username:password@localhost:5432/kampala_centers`
  4. Check database exists: `createdb kampala_centers` if missing

**Problem**: "invalid JWT secret" or authentication always fails
- **Cause**: `JWT_SECRET` not set or not base64-encoded
- **Solution**:
  1. Generate new secret: `openssl rand -base64 32`
  2. Update `JWT_SECRET` in `go-backend/.env`
  3. Restart Go backend
  4. Clear frontend localStorage and login again

**Problem**: GORM migration errors or "table already exists"
- **Cause**: Schema conflicts or manual database changes
- **Solution**:
  1. For development, drop and recreate database: `dropdb kampala_centers && createdb kampala_centers`
  2. Restart Go backend to auto-migrate fresh schema
  3. For production, create explicit migration SQL files

### SSE Connection Issues

**Problem**: SSE connection drops after 30-60 seconds
- **Cause**: Reverse proxy (nginx, ALB) timeout settings
- **Solution**:
  1. Increase proxy read timeout to 300+ seconds
  2. AWS ALB: Set idle timeout to 60+ seconds in ALB settings
  3. nginx: Set `proxy_read_timeout 300s;` in location block

**Problem**: SSE events not received after reconnection
- **Cause**: Client not rejoining rooms after reconnection
- **Solution**: SSE service automatically rejoins rooms on reconnection (see `eventsService.connect()`)

### Build Issues

**Problem**: Frontend build fails with TypeScript errors
- **Cause**: Type mismatches or missing type definitions
- **Solution**:
  1. Run `npm run type-check` to see all errors
  2. Check if `@types/*` packages are installed
  3. Verify `tsconfig.json` includes all necessary directories

**Problem**: Go build fails with "cannot find package"
- **Cause**: Missing Go dependencies
- **Solution**:
  1. Run `cd go-backend && go mod download`
  2. Run `go mod tidy` to clean up dependencies
  3. Check import paths match module name in `go.mod`

### Common Gotchas

1. **Port Conflicts**: Ensure ports 3000 (frontend) and 8080 (backend) are not in use
2. **Environment Variables**: Remember Vite requires `VITE_` prefix and doesn't hot-reload `.env` changes (restart dev server)
3. **CORS**: Frontend and backend must have matching origins in their respective `.env` files
4. **JWT Expiration**: Default is 7 days; expired tokens require logout/login
5. **Database Auto-Migration**: Only works in development; production needs explicit migrations

## Important Architecture Notes

1. **No Socket.io**: This project uses SSE (Server-Sent Events), not Socket.io. Do not attempt to add Socket.io dependencies or use Socket.io patterns.

2. **Deprecated Backend**: The `backend/` directory contains deprecated Node.js code. All new backend work should be done in `go-backend/`.

3. **SSE Limitations**: SSE is unidirectional (server → client). Client actions use REST endpoints, not WebSocket emit/on patterns.

4. **GORM Auto-Migration**: Development environment uses GORM auto-migration. Production should use explicit migrations.

5. **JWT Token Format**: JWT secret should be base64-encoded. Token is passed in `Authorization: Bearer <token>` header or `?token=<token>` query parameter for SSE.

6. **Known Bug**: `AuthContext.tsx` line 100 incorrectly references `socketService` instead of `eventsService` in the register function.

## Next Steps and Development Roadmap

### Immediate Next Steps (Phase A2-A6: Entrepreneur Features)

**Estimated Effort**: 40-50K tokens over 2-3 sessions

**Step 1: Backend Handlers** (15-20K tokens):

1. Create `go-backend/internal/http/handlers/entrepreneurs.go` with CRUD endpoints
2. Create `go-backend/internal/http/handlers/enrollments.go` with enrollment management
3. Create `go-backend/internal/http/handlers/services.go` with service provision tracking
4. Update `go-backend/internal/http/handlers/centers.go` with investor endpoints
5. Register all routes in `go-backend/internal/http/routes.go` with auth middleware
6. Test all endpoints with curl or Postman

**Step 2: Frontend Services** (5-8K tokens):

1. Create `services/entrepreneur.ts` with API client methods
2. Create `services/enrollment.ts` with enrollment API calls
3. Create `services/serviceProvision.ts` with service tracking API calls (avoid naming collision)
4. Add TypeScript interfaces matching Go models

**Step 3: Frontend Components** (20-25K tokens):

1. Create `components/entrepreneur/EntrepreneurRegistrationForm.tsx`
2. Create `components/entrepreneur/EntrepreneurProfile.tsx`
3. Create `components/entrepreneur/EntrepreneurDashboard.tsx`
4. Create `components/hub/HubEnrollmentsManager.tsx`
5. Create `components/hub/ServiceProvisionsManager.tsx`
6. Create `components/hub/InvestorSection.tsx`
7. Create `components/hub/CollaborationManager.tsx`

**Step 4: Integration** (5-7K tokens):

1. Update `components/auth/RegisterForm.tsx` with role selector
2. Update `components/CenterDetail.tsx` with new sections
3. Update `App.tsx` with entrepreneur routing
4. Test all flows end-to-end

### Phase C: Real-time Enhancements (10-12K tokens)

1. Add Notification model to `go-backend/internal/db/models.go`
2. Create notification handlers and routes
3. Emit SSE events for enrollments, services, collaborations
4. Create frontend NotificationBell component
5. Add typing indicators to messaging
6. Add online status tracking

### Deployment Phase (8-10K tokens)

1. Create `RAILWAY-VERCEL-DEPLOYMENT.md` documentation
2. Update `vite.config.ts` with `base: '/centres/'`
3. Deploy backend to Railway with PostgreSQL
4. Deploy frontend to Vercel
5. Configure cPanel DNS/proxy for kii-impact.org/centres
6. Test production deployment end-to-end

### Beads Tracking

Current beads issues track the project status:

- **bd-16**: Phase B UI/UX - COMPLETED
- **bd-17**: Phase A1 Database Schema - COMPLETED
- **bd-18**: Phase A2-A6 Entrepreneur Features - PENDING
- **bd-19**: Phase C Real-time Enhancements - PENDING
- **bd-20**: Deployment Railway+Vercel - PENDING

Use `bd list` to view all issues and `bd show bd-18` for detailed Phase A2-A6 plan.


## Current Deployment State (October 2025)

### Production URLs
- **Frontend:** https://community-centres-platform.vercel.app (Vercel)
- **Backend:** https://communitycentresplatform-production-6caf.up.railway.app (Railway)
- **Database:** PostgreSQL on Railway

### Recent Session Work (October 31, 2025)

**Phase 1 - UI/UX Improvements** ✅ COMPLETE (bd-21)
1. **Critical Bug Fixes:**
   - Fixed "Back to Map" button navigating to about:blank
   - Mobile navigation accessibility (aria-label, title attributes)
   - Files: [CommunityCenter.tsx](components/CommunityCenter.tsx), [App.tsx](App.tsx), [Navigation.tsx](components/Navigation.tsx)

2. **Modal Overlay & Text Contrast (User Pain Point):**
   - Increased overlay opacity from 80% → 92% with backdrop-blur-sm
   - Pure white (light mode) / dark gray (dark mode) backgrounds
   - Strong text contrast: gray-900/white (titles), gray-600/gray-300 (descriptions)
   - Enhanced borders, shadow-2xl, and subtle ring effects
   - Files: [dialog.tsx](components/ui/dialog.tsx), [alert-dialog.tsx](components/ui/alert-dialog.tsx), [sheet.tsx](components/ui/sheet.tsx), [drawer.tsx](components/ui/drawer.tsx)

**Phase 2 - Google Maps Integration** ✅ COMPLETE (bd-21)
1. **New Components:**
   - [components/GoogleMap.tsx](components/GoogleMap.tsx) - Real Google Maps with interactive markers
   - [components/LocationPicker.tsx](components/LocationPicker.tsx) - Draggable pin + search autocomplete
   - [utils/googleMaps.ts](utils/googleMaps.ts) - Google Maps API v2 loader

2. **Features Implemented:**
   - Interactive markers color-coded by verification status (green=verified, blue=admin, gray=pending)
   - Draggable pin with click-to-select location
   - Places Autocomplete search for Kampala addresses
   - Reverse geocoding (coordinates → address)
   - Automatic bounds fitting and marker clustering
   - Fully integrated into AddCenterForm

3. **Configuration & Security:**
   - Added `VITE_GOOGLE_MAPS_API_KEY` to .env.example
   - Requires Google Cloud APIs: Maps JavaScript API, Places API, Geocoding API
   - API key restrictions: HTTP referrers (Vercel domain) + API restrictions (3 APIs only)
   - Uses @googlemaps/js-api-loader v2.0.2 functional API (setOptions + importLibrary)

4. **Production Fix:**
   - Fixed Google Maps loader error: "The Loader class is no longer available"
   - Migrated from deprecated Loader class to v2 functional API
   - Commit: 42a365a

**Deployment Status:**
- ✅ All changes committed and pushed to GitHub (5 commits)
- ✅ Vercel deployment triggered automatically
- ✅ Build successful with Google Maps v2 API
- ✅ Production site: https://community-centres-platform.vercel.app
- ⚠️ Requires `VITE_GOOGLE_MAPS_API_KEY` set in Vercel environment variables

**Beads Tracking:**
- bd-21: Phase 1-2 UI/UX + Google Maps - CLOSED ✅

### Next Steps: Phase 3-5 Pending
- Phase 3: Enhanced search UX (clear button, result count, highlighting)
- Phase 4: Improved interactions (breadcrumbs, share, directions)
- Phase 5: Accessibility audit and improvements

### Google Maps Setup Instructions

**Required Environment Variable:**
```bash
VITE_GOOGLE_MAPS_API_KEY="AIzaSyD-your-api-key-here"
```

**Google Cloud Console Setup:**
1. Create project at https://console.cloud.google.com/
2. Enable APIs: Maps JavaScript API, Places API, Geocoding API
3. Create API key in Credentials
4. Restrict API key:
   - **HTTP referrers**: Add Vercel domain (https://community-centres-platform.vercel.app/*)
   - **API restrictions**: Only allow the 3 required APIs
5. Enable billing (required, but $200/month free tier covers most usage)
6. Set usage quotas and billing alerts

**Security Notes:**
- ✅ SAFE to expose API key in browser (VITE_ prefix) - Google Maps is designed for client-side use
- ✅ Protection comes from API key restrictions (domain + API limits), not from hiding the key
- ⚠️ MUST restrict key to specific domains and APIs in Google Cloud Console
- ⚠️ Monitor usage regularly to detect abuse

