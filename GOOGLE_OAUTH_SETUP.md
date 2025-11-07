# Google OAuth SSO Configuration Guide

## Overview

This guide walks you through setting up Google OAuth Single Sign-On for the Community Centres Platform. The implementation is **complete** - you only need to configure the environment variables.

---

## Prerequisites

- Google Cloud Platform account
- Access to Vercel dashboard (frontend deployment)
- Access to Railway dashboard (backend deployment)
- Domain: centres.kii-impact.org

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Note the **Project ID** for reference

---

## Step 2: Enable Required APIs

Navigate to **APIs & Services** → **Library** and enable:

1. ✅ **Maps JavaScript API** (already enabled)
2. ✅ **Places API** (already enabled)
3. ✅ **Geocoding API** (already enabled)

---

## Step 3: Create OAuth 2.0 Credentials

### 3.1 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - **App name:** Kampala Community Centers Network
   - **User support email:** Your email
   - **Developer contact email:** Your email
   - **Authorized domains:** Add `kii-impact.org`
4. Save and continue through all screens

### 3.2 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Community Centres Platform`
5. **Authorized JavaScript origins:**
   ```
   https://centres.kii-impact.org
   https://community-centres-platform.vercel.app
   http://localhost:3000
   ```

6. **Authorized redirect URIs:** (Leave empty for credential flow)

7. Click **CREATE**
8. **Copy the Client ID** - you'll need this for both frontend and backend

---

## Step 4: Configure Frontend Environment Variables

### Vercel Dashboard

1. Log into [Vercel](https://vercel.com)
2. Navigate to your project: **community-centres-platform**
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Name: VITE_GOOGLE_CLIENT_ID
   Value: YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
   ```
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

### Local Development (.env)

Add to your `.env` file in project root:
```env
VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"
```

---

## Step 5: Configure Backend Environment Variables

### Railway Dashboard

1. Log into [Railway](https://railway.app)
2. Navigate to your project: **communitycentresplatform-production**
3. Go to **Variables** tab
4. Add new variable:
   ```
   Name: GOOGLE_CLIENT_ID
   Value: YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
   ```
5. Click **Deploy** to apply changes

### Local Development (go-backend/.env)

Add to your `go-backend/.env` file:
```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"
```

---

## Step 6: Restrict API Key (Security)

### Frontend API Key (Maps)

1. Go to **APIs & Services** → **Credentials**
2. Find your existing Maps API key
3. Click **Edit**
4. **Application restrictions:**
   - Select **HTTP referrers (web sites)**
   - Add referrers:
     ```
     https://centres.kii-impact.org/*
     https://community-centres-platform.vercel.app/*
     http://localhost:3000/*
     ```

5. **API restrictions:**
   - Select **Restrict key**
   - Select only: Maps JavaScript API, Places API, Geocoding API

6. Click **Save**

### OAuth Client ID Security

**Note:** The OAuth Client ID is **safe to expose** in browser code. Security comes from:
- Domain restrictions (Authorized JavaScript origins)
- Server-side token verification (backend validates all tokens)
- Audience validation (backend checks client ID matches)

---

## Step 7: Verify Configuration

### Test Locally

1. Start backend:
   ```bash
   cd go-backend
   go run cmd/server/main.go
   ```

2. Start frontend:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000
4. Click **Sign In**
5. Click **Continue with Google**
6. Should show Google sign-in popup

### Test Production

1. Redeploy frontend (Vercel auto-deploys on git push)
2. Redeploy backend (Railway auto-deploys on git push)
3. Visit https://centres.kii-impact.org
4. Click **Sign In**
5. Click **Continue with Google**
6. Should show Google sign-in popup with consent screen

---

## Step 8: Monitor Usage & Costs

### Google Cloud Console

1. **Navigation:** APIs & Services → Dashboard
2. Monitor daily API calls:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Token verification requests

### Set Usage Quotas

1. **Navigation:** APIs & Services → Quotas
2. Recommended quotas (prevent abuse):
   - Maps JavaScript API: 25,000 requests/day
   - Places API: 5,000 requests/day
   - Geocoding API: 5,000 requests/day

### Enable Billing Alerts

1. **Navigation:** Billing → Budgets & alerts
2. Create budget: $50/month
3. Set alert thresholds: 50%, 90%, 100%

---

## Cost Estimates

### Free Tier (First 12 months)
- $200 credit per month
- Covers ~28,000 map loads/month
- Covers ~40,000 geocoding requests/month
- Covers ~100,000 autocomplete requests/month

### After Free Tier
- Map loads: $7 per 1,000 loads
- Geocoding: $5 per 1,000 requests
- Autocomplete: $2.83 per 1,000 requests

**Estimated Monthly Cost (typical usage):**
- 5,000 map loads: $35
- 1,000 geocoding: $5
- 2,000 autocomplete: $5.66
- **Total: ~$46/month**

---

## Troubleshooting

### Error: "Invalid Client ID"
- **Cause:** Environment variables not set correctly
- **Fix:** Verify `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend) match exactly

### Error: "Origin not allowed"
- **Cause:** Frontend domain not in Authorized JavaScript origins
- **Fix:** Add domain to OAuth client ID configuration in Google Cloud Console

### Error: "Token verification failed"
- **Cause:** Backend can't reach Google's token verification endpoint
- **Fix:** Check Railway backend logs, verify network connectivity

### Button shows "Continue with Google" but nothing happens
- **Cause:** Missing `VITE_GOOGLE_CLIENT_ID` in frontend
- **Fix:** Add environment variable in Vercel, redeploy

### Sign-in succeeds but user role is always VISITOR
- **Expected:** Google OAuth creates new users with role=VISITOR by default
- **Solution:** Admin must manually upgrade CENTER_MANAGER roles after registration

---

## Security Best Practices

✅ **DO:**
- Restrict OAuth client to specific domains
- Restrict Maps API key to required APIs only
- Set usage quotas to prevent abuse
- Enable billing alerts
- Monitor API usage regularly
- Use HTTPS in production (already configured)

❌ **DON'T:**
- Share API keys in public repositories (use environment variables)
- Skip domain restrictions
- Ignore unusual usage spikes
- Disable server-side token verification

---

## Implementation Details

### Frontend Flow

1. User clicks "Continue with Google" button
2. Google Sign-In popup appears
3. User selects account and grants permissions
4. Google returns credential token (JWT)
5. Frontend sends token to backend: `POST /api/auth/google/verify`
6. Backend verifies token with Google
7. Backend creates/links user account
8. Backend returns JWT token
9. Frontend stores token, logs in user

### Backend Verification

File: [go-backend/internal/auth/google.go](go-backend/internal/auth/google.go)

```go
// Verifies Google token by calling Google's tokeninfo endpoint
// Validates: audience (client ID), email verification
// Returns: email, name, picture URL, Google ID
```

### Account Linking

- **Existing user (same email):** Adds GoogleID to existing account
- **New user:** Creates new account with role=VISITOR, verified=true
- **AuthProvider field:** Set to "GOOGLE" for OAuth users

---

## Files Modified (Already Complete)

### Frontend
- ✅ [components/auth/GoogleLoginButton.tsx](components/auth/GoogleLoginButton.tsx) - Google button component
- ✅ [components/auth/LoginForm.tsx](components/auth/LoginForm.tsx) - Integrated button
- ✅ [contexts/AuthContext.tsx](contexts/AuthContext.tsx) - Added loginWithGoogle
- ✅ [services/api.ts](services/api.ts) - Added API method
- ✅ [App.tsx](App.tsx) - Wrapped with GoogleOAuthProvider

### Backend
- ✅ [go-backend/internal/auth/google.go](go-backend/internal/auth/google.go) - Token verification
- ✅ [go-backend/internal/http/handlers/auth.go](go-backend/internal/http/handlers/auth.go) - GoogleVerify endpoint
- ✅ [go-backend/internal/db/models.go](go-backend/internal/db/models.go) - Added GoogleID, PictureURL fields
- ✅ [go-backend/internal/config/config.go](go-backend/internal/config/config.go) - Added GoogleClientID config

---

## Support

If you encounter issues:

1. Check Railway backend logs: `railway logs`
2. Check Vercel deployment logs: Vercel dashboard → Deployments
3. Verify environment variables: Both Vercel and Railway
4. Test locally first before debugging production

---

## Quick Reference

### Environment Variables Summary

| Variable | Location | Example Value |
|----------|----------|---------------|
| `VITE_GOOGLE_CLIENT_ID` | Frontend (.env, Vercel) | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_ID` | Backend (go-backend/.env, Railway) | `123456789-abc.apps.googleusercontent.com` |
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend (.env, Vercel) | `AIzaSyD-your-api-key` (already set) |

### Deployment Checklist

- [ ] Google Cloud project created
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins configured
- [ ] `VITE_GOOGLE_CLIENT_ID` set in Vercel
- [ ] `GOOGLE_CLIENT_ID` set in Railway
- [ ] API key restrictions configured
- [ ] Billing alerts enabled
- [ ] Production deployment tested
- [ ] User registration tested (Google + Email)
- [ ] Account linking tested (existing email)

---

**Last Updated:** November 7, 2025
**Status:** ✅ Code Complete - Configuration Required
