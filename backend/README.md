# Kampala Community Centers Network - Backend API

Node.js + TypeScript backend for the Kampala Community Centers Network platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.io
- **Deployment**: Railway

## Features

- ✅ User authentication (Admin, Center Manager, Visitor roles)
- ✅ Community center CRUD operations
- ✅ Center verification and connection management
- ✅ Contact messaging system
- ✅ Inter-center messaging threads
- ✅ Real-time messaging with Socket.io
- ✅ Advanced search and filtering
- ✅ Role-based access control
- ✅ Rate limiting and security

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/kampala_centers?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Centers
- `GET /api/centers` - Get all centers (with filtering)
- `GET /api/centers/:id` - Get single center
- `POST /api/centers` - Create new center
- `PATCH /api/centers/:id/verify` - Verify center (Admin only)
- `POST /api/centers/connect` - Connect two centers (Admin only)

### Messages
- `GET /api/messages/contact` - Get contact messages (Admin only)
- `POST /api/messages/contact` - Send contact message
- `GET /api/messages/threads/:centerId` - Get message threads for center
- `GET /api/messages/threads/:threadId/messages` - Get messages in thread
- `POST /api/messages/threads/:threadId/messages` - Send message to thread
- `POST /api/messages/threads` - Create new message thread

## Default Users (After Seeding)

```
Admin: admin@kampalacenters.org / admin123
Visitor: visitor@example.com / visitor123
```

## Socket.io Events

### Client → Server
- `join-center` - Join center-specific room
- `leave-center` - Leave center room
- `join-thread` - Join message thread room
- `leave-thread` - Leave thread room
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

### Server → Client
- `new-message` - New message in thread
- `center-updated` - Center information updated
- `new-contact-message` - New contact message received
- `user-typing` - User typing indicator

## Deployment to Railway

### 1. Database Setup
- Add a PostgreSQL service in Railway
- The `DATABASE_URL` will be automatically provided

### 2. Environment Variables
Set these in Railway dashboard:
- `JWT_SECRET` - Your secret key
- `FRONTEND_URL` - Your deployed frontend URL
- `NODE_ENV` - "production"

### 3. Deploy
```bash
# Connect to Railway (if not already)
railway login
railway init

# Deploy
railway up
```

## Database Schema

### Key Models
- **User** - Authentication and user management
- **CommunityCenter** - Center information and services
- **Connection** - Many-to-many center relationships
- **ContactMessage** - Visitor to center messages
- **MessageThread** - Inter-center communication threads
- **CenterMessage** - Messages within threads

### Relationships
- Users can manage multiple centers
- Centers can connect to multiple other centers
- Message threads can have multiple center participants
- Contact messages link visitors to specific centers

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Request rate limiting
- Input validation
- CORS protection
- Helmet security headers

## Development

### Database Commands
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes (dev)
npm run db:migrate     # Run migrations (prod)
npm run db:seed        # Seed with sample data
```

### Scripts
```bash
npm run dev           # Development server with auto-reload
npm run build         # Build TypeScript to JavaScript
npm start             # Start production server
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/
│   │   └── database.ts     # Prisma client setup
│   ├── middleware/
│   │   └── auth.ts         # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   ├── centers.ts      # Center management routes
│   │   └── messages.ts     # Messaging routes
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── utils/
│   │   ├── seed.ts         # Database seeding
│   │   └── socket.ts       # Socket.io setup
│   └── server.ts           # Main application entry
├── package.json
├── tsconfig.json
├── railway.toml           # Railway deployment config
└── README.md
```