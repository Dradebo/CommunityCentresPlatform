# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application for mapping and connecting community centers in Kampala, Uganda. The platform enables role-based access, real-time messaging between centers, and comprehensive management of community center information.

**Important**: This is a monorepo where frontend and backend are in the same repository. The frontend runs from the project root, while backend code is in the `backend/` directory.

## Architecture Overview

### Frontend (React + TypeScript)
- **Main App**: `App.tsx` - Central application with view routing and state management
- **Authentication**: Context-based auth with JWT tokens via `contexts/AuthContext.tsx`
- **API Layer**: Centralized service in `services/api.ts` with typed endpoints
- **Real-time**: Socket.io client in `services/socket.ts` for live updates
- **UI Components**: Radix UI components in `components/ui/` with Tailwind CSS styling
- **Build System**: Vite with TypeScript, configured in `vite.config.ts`

### Backend (Express + Node.js)
- **Server**: `backend/src/server.ts` - Express server with Socket.io, CORS, and security middleware
- **Database**: Prisma ORM with PostgreSQL, schema in `backend/prisma/schema.prisma`
- **Authentication**: JWT-based auth with bcrypt password hashing
- **API Routes**: Modular routes in `backend/src/routes/` (auth, centers, messages)
- **Real-time**: Socket.io server integration for messaging and live updates
- **Security**: Helmet, rate limiting, input validation, and CORS protection

### Key Data Models (Prisma)
- **User**: Authentication with role-based access (ADMIN, CENTER_MANAGER, VISITOR)
- **CommunityCenter**: Center data with coordinates, services, verification status
- **Connection**: Bidirectional relationships between centers
- **MessageThread/CenterMessage**: Real-time messaging system between verified centers
- **ContactMessage**: Public inquiry system for visitors to contact centers

## Essential Commands

### Development (Full Stack)
```bash
npm install                 # Install all dependencies (frontend + backend)
npm run dev                # Start both frontend and backend in parallel
npm run dev:frontend      # Start only frontend (Vite dev server on :3000)
npm run dev:backend       # Start only backend (nodemon on :3001)
```

### Build & Production
```bash
npm run build             # Build backend only (for Railway deployment)
npm run build:frontend    # Build frontend only (tsc + vite build)
npm run build:production  # Build both frontend and backend
npm start                 # Start production backend server
```

### Code Quality
```bash
npm run lint              # ESLint with auto-fix for entire project
npm run type-check        # TypeScript checking without emit
```

### Database Operations (from project root)
```bash
npm run db:generate       # Generate Prisma client after schema changes
npm run db:push          # Push schema to development database
npm run db:migrate       # Run migrations (production)
npm run db:seed          # Seed database with sample data
```

### Default Credentials (After Seeding)
- **Administrator**: `admin@kampalacenters.org` / `admin123`
- **Visitor**: `visitor@example.com` / `visitor123`

### Backend-Only Commands (from backend/ directory)
```bash
cd backend
npm run dev              # Start backend with nodemon
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production server
npm run db:migrate       # Create and run new migration (development)
```

## Environment Configuration

### Frontend (.env)
```env
VITE_API_URL="http://localhost:3001/api"  # Backend API endpoint
```

### Backend (backend/.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/kampala_centers"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

**Production Note**: In production, update `FRONTEND_URL` to your deployed frontend domain and ensure `DATABASE_URL` points to your production database.

## Authentication Flow

The app uses a centralized authentication pattern:
1. `AuthContext.tsx` manages global auth state
2. JWT tokens stored in localStorage with automatic refresh
3. `services/api.ts` handles token attachment to requests
4. Socket.io connections authenticated with same JWT token
5. Role-based UI rendering and API endpoint protection

## Real-time Features Architecture

Socket.io events managed through `services/socket.ts`:
- **Connection**: Automatic connection on auth with token validation
- **Messages**: Real-time delivery of center-to-center messages
- **Updates**: Live center verification and connection status changes
- **Notifications**: Admin notifications for contact messages

## Deployment Options

### Frontend Deployment

#### Vercel (Recommended)
- Deploy directly from Git repository
- Automatic builds on push to main branch
- Set `VITE_API_URL` environment variable to backend URL
- Build command: `npm run build:frontend`
- Output directory: `dist`

#### cPanel/Shared Hosting
- Build locally: `npm run build:frontend`
- Upload `dist/` folder contents to public_html
- Ensure `.htaccess` includes SPA routing rules for React Router

#### Personal VPS/Server
- Build: `npm run build:frontend`
- Serve with nginx, Apache, or static file server
- Configure reverse proxy if serving backend from same domain

### Backend Deployment

#### Personal VPS/Server
- Install Node.js 18+ and PostgreSQL
- Clone repository and run `npm install` in backend/
- Set environment variables in `.env` file
- Run migrations: `npm run db:migrate`
- Start with PM2: `pm2 start dist/server.js`

#### cPanel Node.js Hosting
- Upload backend files and run `npm install`
- Configure Node.js app in cPanel
- Import database schema and run migrations
- Set environment variables in cPanel interface

#### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string for JWT signing
- `FRONTEND_URL` - Your frontend domain for CORS
- `NODE_ENV` - Set to "production"

## State Management Pattern

The app uses React Context + hooks pattern:
- **AuthContext**: Global authentication state
- **Component State**: Local state with useState for UI interactions
- **API State**: Optimistic updates with server sync via `apiService`
- **Real-time Sync**: Socket.io events update local state automatically

## Key Integration Points

1. **Authentication Flow**: `AuthContext` → `apiService` → `socketService`
2. **Data Flow**: UI Components → `apiService` → Backend API → Database
3. **Real-time Updates**: Socket.io → Component State Updates → UI Re-render
4. **Role-Based Access**: `AuthContext` roles control component rendering and API access

## Common Development Tasks

### Adding a New API Endpoint
1. Add route handler in `backend/src/routes/`
2. Add method to `services/api.ts` with proper typing
3. Update component to use new API method
4. Consider real-time updates via Socket.io if needed

### Database Schema Changes
1. Update `backend/prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:push` (dev) or `npm run db:migrate` (prod)
4. Update TypeScript interfaces to match new schema

### Adding Real-time Features
1. Add event handlers in `backend/src/utils/socket.ts` (server-side Socket.io handlers)
2. Emit events from API route handlers using `io.emit()` or `socket.emit()`
3. Add event listeners in `services/socket.ts` (client-side Socket.io listeners)
4. Update component state on socket events received

## Security Considerations

- JWT tokens have configurable expiration
- All API endpoints require authentication except health check
- Rate limiting on all `/api` endpoints (100 requests/15min per IP)
- CORS configured for specific frontend URL
- Helmet security headers enabled
- Input validation using express-validator
- Password hashing with bcrypt

## Testing Notes

The codebase doesn't include test configurations yet. When adding tests:
- Frontend: Consider Vitest + React Testing Library
- Backend: Consider Jest + Supertest for API testing
- E2E: Consider Playwright for full-stack testing
