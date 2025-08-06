# 🏗️ Team Development Setup Guide

## 🎯 **Database Sharing Options**

### **Option 1: Cloud Database (Recommended)**

#### **Supabase Setup (Free Tier)**

1. **Create Supabase Project:**
   ```bash
   # Go to https://supabase.com
   # Sign up and create new project
   # Get database URL from Settings → Database
   ```

2. **Environment Variables for Team:**
   ```bash
   # .env file for all team members
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. **Team Setup Steps:**
   ```bash
   # Each team member runs:
   git clone https://github.com/sainaka516/Kulture.git
   cd Kulture
   git checkout development
   npm install
   # Copy the shared .env file
   npx prisma generate
   npx prisma migrate deploy
   npm run dev
   ```

#### **Railway Setup (Alternative)**

1. **Create Railway Project:**
   ```bash
   # Go to https://railway.app
   # Create new project → PostgreSQL
   # Get connection string from Variables tab
   ```

2. **Share with Team:**
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"
   ```

### **Option 2: Local Network Database**

If you want to share your local PostgreSQL:

#### **Configure PostgreSQL for Network Access**

1. **Edit PostgreSQL Configuration:**
   ```bash
   # Find postgresql.conf (usually in /etc/postgresql/[version]/main/)
   # Or on Mac: /usr/local/var/postgres/postgresql.conf
   
   # Add/modify these lines:
   listen_addresses = '*'
   port = 5432
   ```

2. **Edit pg_hba.conf for Authentication:**
   ```bash
   # Add this line to allow connections:
   host    all             all             0.0.0.0/0               md5
   ```

3. **Restart PostgreSQL:**
   ```bash
   # Mac
   brew services restart postgresql
   
   # Linux
   sudo systemctl restart postgresql
   
   # Windows
   # Restart PostgreSQL service from Services
   ```

4. **Get Your IP Address:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

5. **Share Connection String:**
   ```bash
   # Replace [YOUR_IP] with your actual IP address
   DATABASE_URL="postgresql://kulture_user:your_password@[YOUR_IP]:5432/kulture"
   ```

#### **Firewall Configuration**

**macOS:**
```bash
# Allow PostgreSQL through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/postgres
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/local/bin/postgres
```

**Windows:**
- Open Windows Defender Firewall
- Add new rule for PostgreSQL (port 5432)

**Linux:**
```bash
sudo ufw allow 5432
```

### **Option 3: Docker Database (Advanced)**

1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:14
       environment:
         POSTGRES_DB: kulture
         POSTGRES_USER: kulture_user
         POSTGRES_PASSWORD: your_password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Start Database:**
   ```bash
   docker-compose up -d
   ```

3. **Share with Team:**
   ```bash
   DATABASE_URL="postgresql://kulture_user:your_password@localhost:5432/kulture"
   ```

## 🔧 **Team Development Workflow**

### **Initial Setup for New Team Member**

1. **Clone Repository:**
   ```bash
   git clone https://github.com/sainaka516/Kulture.git
   cd Kulture
   git checkout development
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   # Copy shared .env file or create with shared DATABASE_URL
   cp .env.example .env
   # Edit .env with shared database credentials
   ```

4. **Database Setup:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Start Development:**
   ```bash
   npm run dev
   ```

### **Daily Development Workflow**

1. **Start of Day:**
   ```bash
   git checkout development
   git pull origin development
   npm install  # if dependencies changed
   npx prisma generate  # if schema changed
   ```

2. **Feature Development:**
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes...
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

3. **End of Day:**
   ```bash
   # Create pull request to development branch
   # Or merge if working solo
   ```

## 🚨 **Important Security Notes**

### **For Shared Databases**

1. **Never commit .env files:**
   ```bash
   # Ensure .env is in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment-specific secrets:**
   ```bash
   # Development
   NEXTAUTH_SECRET="dev-secret-key"
   
   # Production (different secret)
   NEXTAUTH_SECRET="production-secret-key"
   ```

3. **Share credentials securely:**
   - Use password managers
   - Team chat (Slack/Discord)
   - Never in public repositories

### **Database Backup Strategy**

1. **Regular Backups:**
   ```bash
   # Add to your workflow
   npm run db:backup
   ```

2. **Before Major Changes:**
   ```bash
   # Always backup before migrations
   npm run db:safe-migrate
   ```

## 🎯 **Recommended Setup for Your Team**

### **For Small Teams (2-5 developers):**

**Use Supabase (Free Tier):**
- ✅ No local PostgreSQL needed
- ✅ Automatic backups
- ✅ Web interface for data viewing
- ✅ Real-time subscriptions
- ✅ Free for small projects

### **For Larger Teams (5+ developers):**

**Use Railway or AWS RDS:**
- ✅ Scalable
- ✅ Better performance
- ✅ More control
- ✅ Paid but reasonable pricing

### **For Learning/Personal Projects:**

**Use Local Network Database:**
- ✅ Free
- ✅ Full control
- ✅ Good for learning
- ⚠️ Requires network configuration

## 🚀 **Quick Start Commands**

### **For New Team Member:**

```bash
# 1. Clone and setup
git clone https://github.com/sainaka516/Kulture.git
cd Kulture
git checkout development

# 2. Install dependencies
npm install

# 3. Setup environment (copy shared .env)
cp .env.example .env
# Edit .env with shared DATABASE_URL

# 4. Setup database
npx prisma generate
npx prisma migrate deploy

# 5. Start development
npm run dev
```

### **For Database Owner:**

```bash
# 1. Share your database URL with team
# 2. Ensure PostgreSQL is running
# 3. Check network access
pg_isready -h localhost -p 5432

# 4. Monitor connections
psql -c "SELECT * FROM pg_stat_activity;"
```

This setup ensures all team members can work on the same database without individual PostgreSQL installations! 