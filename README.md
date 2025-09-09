# Kampala Community Centers Network

A comprehensive web platform that maps, connects, and tracks linkages among community centers in Kampala. The platform features an admin system for center verification, interactive mapping, detailed center profiles, and real-time messaging between centers.

## 🚀 Features

### Core Functionality
- **Interactive Map Interface** - Visual map showing all community centers with filtering
- **User Authentication** - Role-based access (Admin, Center Manager, Visitor)
- **Center Management** - Add, verify, and manage community center profiles
- **Real-time Messaging** - Communication system between verified centers
- **Advanced Search & Filtering** - Filter by services, location, verification status
- **Admin Dashboard** - Comprehensive management interface for administrators

### User Roles
- **Administrators** - Can verify centers, manage connections, access all features
- **Center Managers** - Can manage their centers and participate in messaging
- **Visitors** - Can browse centers, add new centers, and send contact messages

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Radix UI** components
- **Socket.io Client** for real-time features
- **Lucide React** for icons

### Backend
- **Node.js 18+** with TypeScript
- **Express.js** web framework
- **PostgreSQL** database
- **Prisma ORM** for database management
- **Socket.io** for real-time messaging
- **JWT Authentication** with bcrypt
- **Railway** deployment platform

## 📦 Project Structure

```
├── frontend/
│   ├── App.tsx                 # Main application component
│   ├── components/             # React components
│   │   ├── auth/              # Authentication components
│   │   ├── ui/                # Shadcn/UI components
│   │   └── ...                # Feature components
│   ├── contexts/              # React contexts
│   ├── services/              # API and Socket services
│   └── styles/                # CSS and styling
├── backend/                   # Backend API server
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Main server file
│   ├── prisma/              # Database schema
│   └── package.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Railway account (for deployment)

### Frontend Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

3. **Create Environment File**
```bash
cp .env.example .env
```

4. **Start Development Server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to Backend Directory**
```bash
cd backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/kampala_centers"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3001
```

4. **Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

5. **Start Backend Server**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 🔐 Authentication

### Default Accounts (After Seeding)
- **Administrator**: `admin@kampalacenters.org` / `admin123`
- **Visitor**: `visitor@example.com` / `visitor123`

### User Registration
New users can register as either:
- **Visitor** - Immediate access to browse and add centers
- **Center Manager** - Requires admin approval for management features

## 📊 Database Schema

### Key Models
- **User** - Authentication and role management
- **CommunityCenter** - Center information and services
- **Connection** - Relationships between centers
- **ContactMessage** - Visitor inquiries to centers
- **MessageThread** - Communication threads between centers
- **CenterMessage** - Messages within threads

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Centers
- `GET /api/centers` - List centers with filtering
- `POST /api/centers` - Create new center
- `PATCH /api/centers/:id/verify` - Verify center (Admin)
- `POST /api/centers/connect` - Connect centers (Admin)

### Messaging
- `GET /api/messages/contact` - Get contact messages (Admin)
- `POST /api/messages/contact` - Send contact message
- `GET /api/messages/threads/:centerId` - Get message threads
- `POST /api/messages/threads` - Create message thread

## 🔌 Real-time Features

### Socket.io Events
- **new-message** - Real-time message delivery
- **center-updated** - Live center updates
- **new-contact-message** - Admin notifications
- **user-typing** - Typing indicators

## 🚀 Deployment

### Railway Deployment

#### Backend Deployment
1. **Connect Repository to Railway**
```bash
railway login
railway init
```

2. **Add PostgreSQL Service**
   - Add PostgreSQL service in Railway dashboard
   - `DATABASE_URL` will be automatically provided

3. **Set Environment Variables**
   - `JWT_SECRET` - Your secret key
   - `FRONTEND_URL` - Your deployed frontend URL
   - `NODE_ENV` - "production"

4. **Deploy**
```bash
railway up
```

#### Frontend Deployment
The frontend can be deployed to any static hosting service (Vercel, Netlify, etc.) or Railway.

Update `NEXT_PUBLIC_API_URL` to point to your deployed backend.

## 🛡️ Security Features

### 🔒 Repository Security
- **Environment Variables**: All secrets stored in `.env` files (NEVER committed)
- **Comprehensive .gitignore**: Protects against committing sensitive files
- **No Hardcoded Secrets**: All credentials use environment variables
- **Safe Defaults**: Development fallbacks are localhost-only

### Application Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Request rate limiting
- Input validation and sanitization
- CORS protection
- Security headers with Helmet

### ⚠️ Security Reminder
**NEVER commit `.env` files or any files containing secrets to version control!**

The `.gitignore` file protects:
- Environment files (`.env*`)
- Node modules (`node_modules/`)
- Build artifacts (`dist/`, `build/`)
- Logs and cache files
- Database files
- Security certificates

## 🎯 Key Features Deep Dive

### Interactive Mapping
- Visual representation of all community centers
- Click to view detailed center information
- Real-time filtering and search
- Connection visualization between centers

### Admin Dashboard
- Comprehensive analytics and statistics
- Center verification workflow
- Connection management
- Contact message handling
- User management

### Messaging System
- Secure communication between verified centers
- Thread-based conversations
- Real-time message delivery
- Typing indicators
- Message history

### Advanced Filtering
- Search by name, location, services, or description
- Filter by verification status
- Filter by connection status
- Filter by who added the center
- Service-specific filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the Kampala community development initiative
- Uses open-source technologies and libraries
- Designed to facilitate community center networking and collaboration

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**Building stronger communities through better connections** 🏢🤝