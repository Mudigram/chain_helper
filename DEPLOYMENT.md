# 📦 Deployment Guide - ChainHelper AI

Complete step-by-step guide to deploy ChainHelper AI to production.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Backend Deployment (Render - Alternative)](#backend-deployment-render)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Custom Domain Setup](#custom-domain-setup)

---

## Pre-Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] OpenAI API key obtained
- [ ] `.env` files added to `.gitignore`
- [ ] Test locally to ensure everything works
- [ ] Create `.env.example` files for documentation

### Create .env.example Files

**Backend** (`backend/.env.example`):
```
OPENAI_API_KEY=your_openai_api_key_here
```

**Add to `.gitignore`**:
```
# Environment variables
.env
*.env
.env.local

# Python
__pycache__/
*.pyc
venv/

# Node
node_modules/
.next/
```

---

## Frontend Deployment (Vercel)

Vercel is the recommended platform for Next.js apps (made by the same team).

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### Step 3: Import Project

1. Click "Add New..." → "Project"
2. Click "Import" next to your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

### Step 4: Configure Environment Variables

For now, use localhost for testing:
- Name: `NEXT_PUBLIC_API_URL`
- Value: `http://localhost:8001` (will update after backend deployment)

### Step 5: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-project.vercel.app`

### Step 6: Update After Backend Deployment

1. After deploying backend, go to Project Settings
2. Navigate to "Environment Variables"
3. Update `NEXT_PUBLIC_API_URL` to your backend URL
4. Redeploy from Deployments tab

---

## Frontend Deployment (Netlify)

Since you have a `netlify.toml`, you can deploy to Netlify:

### Step 1: Push to GitHub

### Step 2: Create Site on Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import from existing project"
3. Select GitHub → Choose your repository

### Step 3: Configure Build
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `.next` (or let Netlify auto-detect Next.js)

### Step 4: Add Environment Variable (Crucial!)
1. Go to **Site Settings** > **Configuration** > **Environment variables**
2. Click **Add a variable**
3. Key: `NEXT_PUBLIC_API_URL`
4. Value: `https://chain-helper.onrender.com` (Your Render URL)
5. Click **Create variable**

### Step 5: Deploy
- Click "Deploy site"


---

## Backend Deployment (Railway)

Railway is great for Python/FastAPI backends with free tier.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway will auto-detect it's a Python app

### Step 3: Configure Service

1. **Name**: Set a meaningful name like "chainhelper-api"
2. **Root Directory**: Click "Settings" → Set to `backend`
3. **Start Command**: 
   ```
   uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

### Step 4: Add Environment Variables

Go to "Variables" tab:

```
OPENAI_API_KEY=your_actual_openai_key_here
PORT=8000
```

### Step 5: Generate Domain

1. Go to "Settings" tab
2. Click "Generate Domain" under "Public Networking"
3. You'll get a URL like: `chainhelper-api.railway.app`

### Step 6: Update CORS (Important!)

Update `backend/app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend.vercel.app",  # Add your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 7: Push Changes

```bash
git add .
git commit -m "Update CORS for production"
git push origin main
```

Railway will automatically redeploy.

---

## Backend Deployment (Render)

Alternative to Railway, also has a free tier.

### Step 1: Create Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the repository

### Step 3: Configure Service

```
Name: chainhelper-backend
Region: Choose closest to your users
Branch: main
Root Directory: backend
Runtime: Python 3

Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Step 4:Choose Instance Type

- Select "Free" tier for testing
- Can upgrade later for better performance

### Step 5: Environment Variables

Add in the "Environment" section:
```
OPENAI_API_KEY=your_key_here
```

### Step 6: Deploy

1. Click "Create Web Service"
2. Wait for build (3-5 minutes)
3. You'll get a URL like: `https://chainhelper-backend.onrender.com`

---

## Environment Variables

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `PORT` | Port number (auto-set by host) | No |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.example.com` |

**Note**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser.

---

## Post-Deployment

### 1. Update Frontend API URL

In `frontend/app/page.tsx`, change:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
```

Add to Vercel environment variables:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 2. Test the Deployment

1. Visit your Vercel URL
2. Open browser console (F12)
3. Connect Phantom wallet
4. Test each feature:
   - Check Balance
   - AI Assistant
   - Transaction Simulation
   - AI Transaction Agent

### 3. Monitor Logs

**Vercel**:
- Click on your deployment
- View "Function Logs" for errors

**Railway**:
- Click "View Logs" to see real-time logs
- Check for errors or warnings

**Render**:
- Logs tab shows all output
- Filter by error level

### 4. Set Up Monitoring (Optional)

**Vercel Analytics**:
- Enable in project settings
- Track page views and performance

**Railway Metrics**:
- Monitor CPU/Memory usage
- Set up alerts for downtime

---

## Custom Domain Setup

### Frontend (Vercel)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `chainhelper.com`)
3. Update DNS records as instructed:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)

### Backend (Railway)

1. Go to Settings → Public Networking
2. Add Custom Domain
3. Enter your API subdomain: `api.chainhelper.com`
4. Update DNS:
   ```
   Type: CNAME
   Name: api
   Value: [railway-provided-value]
   ```

---

## Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS updated with production URLs
- [ ] API URL updated in frontend code
- [ ] Tested wallet connection
- [ ] Tested balance checking
- [ ] Tested AI queries
- [ ] Tested transaction simulation
- [ ] Tested AI transaction agent
- [ ] Logs monitored for errors
- [ ] (Optional) Custom domain configured

---

## Troubleshooting

### "Failed to fetch" Errors

**Issue**: Frontend can't connect to backend

**Solutions**:
1. Verify backend is running and accessible
2. Check CORS configuration includes your Vercel URL
3. Ensure `NEXT_PUBLIC_API_URL` is set correctly
4. Check browser console for exact error

### OpenAI API Errors

**Issue**: "Invalid API key" or rate limit errors

**Solutions**:
1. Verify API key in Railway/Render environment variables
2. Check OpenAI account has credits
3. Try regenerating API key

### Build Failures

**Frontend**:
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Review build logs for specific errors

**Backend**:
- Verify Python version (3.8+)
- Check all packages in `requirements.txt`
- Look for missing system dependencies

### Wallet Connection Issues

**Issue**: Can't connect Phantom on production

**Solutions**:
1. Ensure you're using HTTPS (Phantom requires it)
2. Check browser console for security errors
3. Verify Phantom extension is installed

---

## Cost Estimates

### Free Tier Limits

**Vercel**:
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Hobby projects

**Railway** (Free Tier):
- ✅ $5 free credit/month
- ✅ ~500 hours of uptime
- ⚠️ May sleep after inactivity

**Render** (Free Tier):
- ✅ 750 hours/month
- ⚠️ Sleeps after 15min inactivity
- ⚠️ Slower cold starts

**OpenAI**:
- GPT-4o-mini: ~$0.15 per 1M input tokens
- Very cheap for moderate use

### Recommended for Production

**Vercel**: Pro ($20/month) - More bandwidth
**Railway**: Hobby ($5/month) - No sleeping
**Render**: Starter ($7/month) - Dedicated resources

---

## Security Best Practices

1. **Never commit `.env` files**
2. **Rotate API keys** regularly
3. **Use environment variables** for all secrets
4. **Enable HTTPS** (automatic on Vercel/Railway/Render)
5. **Limit CORS** to specific domains in production
6. **Monitor API usage** to detect abuse
7. **Set rate limits** on backend endpoints
8. **Use devnet** for testing (change RPC URL)

---

## Next Steps After Deployment

1. Share your app with users
2. Collect feedback
3. Monitor usage and errors
4. Consider adding:
   - User authentication
   - Transaction history
   - Multiple wallet support
   - Token swaps
   - NFT interactions

---

**Congratulations! Your ChainHelper AI is now live! 🎉**

Need help? Open an issue on GitHub or check logs for debugging.
