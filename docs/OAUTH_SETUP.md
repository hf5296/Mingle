# Google OAuth v2 Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "Mingle API" → Create

## Step 2: Enable Google+ API

1. Navigate to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

## Step 3: Create OAuth v2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen:
   - User Type: External
   - App name: Mingle API
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Add scopes: `email`, `profile`
5. Add test users (your email)
6. Save and continue

## Step 4: Create OAuth Client ID

1. Application type: Web application
2. Name: Mingle API OAuth Client
3. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://your-vm-ip:3000`
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `http://your-vm-ip:3000/api/auth/google/callback`
5. Click "Create"

## Step 5: Copy Credentials to .env

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback