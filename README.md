# Kulture

Kulture is a modern social platform for sharing and verifying takes within communities. It allows users to:

- Share takes in specific communities
- Get takes verified by community consensus
- Build reputation through verified takes
- Join and participate in hierarchical communities
- Connect with friends and follow their takes

## Getting Started

First, set up your environment variables:

```bash
cp .env.example .env
```

Then, install dependencies and run the development server:

```bash
npm install
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

## Development

To work on Kulture locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

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
