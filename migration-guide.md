# Migration Guide: Railway Backend → Vercel Backend + cPanel Frontend

## Current Setup Analysis
- **Frontend**: Vercel (https://your-app.vercel.app)
- **Backend**: Railway (https://your-app.railway.app)
- **Database**: Railway PostgreSQL

## Target Setup
- **Frontend**: cPanel (https://yourdomain.com)
- **Backend**: Vercel (https://your-api.vercel.app)
- **Database**: Vercel PostgreSQL

## Migration Steps

### Phase 1: Prepare New Vercel Backend (Parallel Setup)

1. **Create New Vercel Project for Backend**
   ```bash
   # Option A: Create separate Vercel project for backend
   # In Vercel dashboard, create new project from same repo
   # Name it: "kampala-centers-api" or similar

   # Option B: Modify existing Vercel project
   # Update existing project to backend-only (we've already configured this)
   ```

2. **Set Up Vercel Postgres Database**
   ```bash
   # In Vercel dashboard → Storage → Create Database → Postgres
   # Note the connection details
   ```

3. **Export Data from Railway**
   ```bash
   # Connect to your Railway database
   railway db connect

   # Or get connection string from Railway dashboard
   # Then export your data:
   pg_dump "your-railway-db-url" > railway-backup.sql
   ```

4. **Import Data to Vercel Postgres**
   ```bash
   # Get Vercel database URL from dashboard
   # Import your data:
   psql "your-vercel-postgres-url" < railway-backup.sql
   ```

### Phase 2: Configure New Backend

1. **Update Environment Variables in New Vercel Project**
   ```env
   DATABASE_URL=your-new-vercel-postgres-url
   JWT_SECRET=your-existing-jwt-secret
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://yourdomain.com  # Your future cPanel domain
   NODE_ENV=production
   ```

2. **Test New Backend**
   ```bash
   # Test health endpoint
   curl https://your-new-vercel-backend.vercel.app/api/health

   # Test auth endpoint
   curl -X POST https://your-new-vercel-backend.vercel.app/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@kampalacenters.org","password":"admin123"}'
   ```

### Phase 3: Prepare Frontend for cPanel

1. **Update Environment Variables**
   ```bash
   # Update .env.production
   VITE_API_URL=https://your-new-vercel-backend.vercel.app/api
   ```

2. **Build Frontend for cPanel**
   ```bash
   npm run build:frontend:production
   ```

3. **Test Locally Against New Backend**
   ```bash
   # Serve the built files locally and test
   npx serve dist -p 3000
   ```

### Phase 4: Switch to New Setup

1. **Deploy Frontend to cPanel**
   - Upload `dist/` contents to `public_html/`
   - Include `.htaccess` file
   - Test functionality

2. **Update DNS (if using custom domain)**
   - Point your domain to cPanel hosting
   - Update any CNAME records

3. **Update CORS Settings**
   ```bash
   # In new Vercel backend, update FRONTEND_URL to your cPanel domain
   FRONTEND_URL=https://yourdomain.com
   ```

### Phase 5: Cleanup (After Everything Works)

1. **Shutdown Old Services**
   - Delete old Vercel frontend project
   - Scale down Railway backend
   - Keep Railway database backup for a few days

2. **Monitor and Verify**
   - Check all functionality works
   - Monitor error logs
   - Verify real-time features work

## Rollback Plan (If Issues Occur)

1. **Immediate Rollback**
   ```bash
   # Revert DNS to point back to Vercel frontend
   # Or update Vercel frontend environment to point back to Railway
   ```

2. **Database Rollback**
   ```bash
   # If data issues, re-import from Railway backup
   ```

## Testing Checklist

- [ ] Health endpoint responds
- [ ] Authentication works
- [ ] User registration works
- [ ] Centers can be added/verified
- [ ] Messaging system works
- [ ] Real-time updates work (SSE/polling)
- [ ] Contact forms work
- [ ] Admin dashboard functions
- [ ] Mobile responsiveness
- [ ] All API endpoints respond correctly

## Environment Variables Mapping

### From Railway Backend
```env
DATABASE_URL=railway-postgres-url
JWT_SECRET=your-secret
FRONTEND_URL=https://your-app.vercel.app
```

### To Vercel Backend
```env
DATABASE_URL=vercel-postgres-url
JWT_SECRET=same-secret
FRONTEND_URL=https://yourdomain.com
```

### Frontend (Old Vercel)
```env
VITE_API_URL=https://your-app.railway.app/api
```

### Frontend (New cPanel)
```env
VITE_API_URL=https://your-new-backend.vercel.app/api
```