# Kulture

Kulture is a modern social platform for sharing and verifying takes within communities. It allows users to:

- Share takes in specific communities
- Get takes verified by community consensus
- Build reputation through verified takes
- Join and participate in hierarchical communities
- Connect with friends and follow their takes

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.0.0 or later
- PostgreSQL 14.0 or later
- npm or yarn package manager

### Setting up PostgreSQL

1. Install PostgreSQL:
   - **Mac**: `brew install postgresql`
   - **Windows**: Download from [PostgreSQL website](https://www.postgresql.org/download/windows/)
   - **Linux**: `sudo apt-get install postgresql`

2. Start PostgreSQL service:
   - **Mac**: `brew services start postgresql`
   - **Windows**: PostgreSQL service should start automatically
   - **Linux**: `sudo service postgresql start`

3. Create a database:
```bash
psql postgres
CREATE DATABASE kulture;
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kulture.git
cd kulture
```

2. Set up your environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database connection string:
```
DATABASE_URL="postgresql://yourusername:yourpassword@localhost:5432/kulture"
```

4. Install dependencies:
```bash
npm install
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- 🌟 Community-based take verification
- 👥 Hierarchical communities (sub-kultures)
- 🏆 Leaderboard with Kulture Kings
- 🤝 Friend connections
- 🔍 Advanced search functionality
- 🌓 Dark mode support
- 📱 Responsive design

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Prisma with PostgreSQL
- NextAuth.js for authentication
- Tailwind CSS
- Radix UI primitives
- React Spring for animations

## Common Setup Issues

### Database Connection

If you see database connection errors, check:
1. PostgreSQL is running (`pg_isready` in terminal)
2. Your database exists (`psql -l` to list databases)
3. Your `.env` file has the correct DATABASE_URL
4. Your PostgreSQL username and password are correct

### Migration Issues

If you encounter migration issues:
1. Reset the database: `npx prisma migrate reset`
2. Apply migrations again: `npx prisma migrate dev`
3. Generate Prisma Client: `npx prisma generate`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
