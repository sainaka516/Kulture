# 🔐 Environment Variables Setup Guide

## 🚨 **Required Environment Variables**

When cloning the repository on a new device, you need to set up the following environment variables in your `.env` file:

### **1. Database Configuration**
```bash
# Required for database connection
DATABASE_URL="postgresql://username:password@host:port/database"
```

### **2. NextAuth.js Configuration**
```bash
# Required for authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### **3. Google OAuth Configuration (Required for Sign-In)**
```bash
# Required for Google sign-in functionality
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🔧 **How to Get Google OAuth Credentials**

### **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

### **Step 2: Create OAuth 2.0 Credentials**

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - **Name**: `Kulture Development` (or any name)
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:3001
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     http://localhost:3001/api/auth/callback/google
     ```

### **Step 3: Get Your Credentials**

After creating the OAuth client, you'll get:
- **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

## 📝 **Complete .env File Example**

Create a `.env` file in the root directory with:

```bash
# Database
DATABASE_URL="postgresql://kulture_user:your_password@localhost:5432/kulture"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"

# Google OAuth (Required for sign-in)
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"

# Optional: Environment
NODE_ENV="development"
```

## 🚀 **Quick Setup for New Team Members**

### **Option 1: Use Shared Credentials (Recommended)**

1. **Get credentials from team lead:**
   - Ask for the shared Google OAuth credentials
   - Get the shared database URL
   - Get the shared NEXTAUTH_SECRET

2. **Create .env file:**
   ```bash
   # Copy the shared .env file or create new one
   cp .env.example .env
   # Edit with shared credentials
   ```

3. **Start development:**
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run dev
   ```

### **Option 2: Create Your Own Credentials**

1. **Follow Google OAuth setup above**
2. **Create your own .env file**
3. **Test the setup**

## 🔍 **Troubleshooting**

### **Error: "client_id is required"**

This error occurs when `GOOGLE_CLIENT_ID` is missing or incorrect.

**Solution:**
1. Check your `.env` file has `GOOGLE_CLIENT_ID`
2. Ensure the value is correct (no extra spaces)
3. Restart your development server:
   ```bash
   npm run dev
   ```

### **Error: "redirect_uri_mismatch"**

This error occurs when the redirect URI doesn't match.

**Solution:**
1. Go to Google Cloud Console
2. Update your OAuth 2.0 client
3. Add the correct redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### **Error: "invalid_client"**

This error occurs when credentials are incorrect.

**Solution:**
1. Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Ensure they're copied correctly (no extra characters)
3. Verify the OAuth client is configured for web application

## 🛡️ **Security Best Practices**

### **Never Commit .env Files**
```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

### **Use Different Credentials for Environments**
```bash
# Development
GOOGLE_CLIENT_ID="dev-client-id"
GOOGLE_CLIENT_SECRET="dev-client-secret"

# Production (different credentials)
GOOGLE_CLIENT_ID="prod-client-id"
GOOGLE_CLIENT_SECRET="prod-client-secret"
```

### **Share Credentials Securely**
- Use password managers
- Team chat (Slack/Discord)
- Never in public repositories
- Never in commit messages

## 🎯 **Team Setup Checklist**

### **For Team Lead:**
- [ ] Create Google Cloud project
- [ ] Set up OAuth 2.0 credentials
- [ ] Share credentials with team
- [ ] Set up shared database
- [ ] Document setup process

### **For Team Members:**
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Create .env file
- [ ] Add shared credentials
- [ ] Test sign-in functionality
- [ ] Verify database connection

## 🚀 **Quick Commands**

### **Check Environment Variables:**
```bash
# Check if .env exists
ls -la .env

# Check environment variables (if using dotenv-cli)
npx dotenv -e .env -- echo $GOOGLE_CLIENT_ID
```

### **Test Setup:**
```bash
# Build to check for errors
npm run build

# Start development server
npm run dev

# Test sign-in at http://localhost:3000/sign-in
```

This setup ensures all team members can use Google OAuth sign-in without individual credential setup! 