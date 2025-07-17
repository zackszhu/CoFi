# CoFi - Couples Finance Tracker

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue)](LICENSE)

CoFi is a privacy-focused finance tracking application designed for couples. It provides transparency on overall spending while keeping individual transactions private, helping families maintain healthy financial habits through comprehensive analytics and insights.

## 💭 Motivation

Managing family finances as a couple is challenging. Existing solutions either force complete transparency (awkward for personal purchases) or complete separation (missing the big picture). CoFi solves this by introducing **selective privacy** - the first and only spending tracker that lets couples share overall financial trends while keeping individual transactions private.

With CoFi, you can:

- Share monthly spending summaries without revealing every coffee purchase
- Keep surprise gifts or personal expenses truly private
- Maintain financial transparency without sacrificing personal privacy
- Build trust through shared financial goals while respecting individual autonomy

## ✨ Features

- **🔒 Privacy-First Design**: Share overall spending trends while keeping individual transactions private
- **📊 Comprehensive Analytics**: Monthly income, spending, and net balance charts
- **👥 Multi-User Support**: Designed for couples with individual PIN-based authentication
- **📱 Modern UI**: Clean, responsive interface built with React 19 and Tailwind CSS
- **📈 Category Analytics**: Track spending by categories with customizable views
- **🔍 Advanced Filtering**: Search, sort, and filter transactions with pagination
- **📊 Data Import**: CSV import functionality for bulk transaction uploads
- **🎨 Beautiful Charts**: Interactive visualizations using Recharts

## 🚀 Quick Start

### Prerequisites

- Node.js 15+
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/zackszhu/CoFi.git
   cd cofi
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure the application**
   - Copy environment variables: `cp .env.example .env.local`
   - Edit `.env.local` and set your NextAuth.js secret and other required variables
   - Configure application settings in `cofi.config.yaml` (categories, user settings, etc.)

4. **Initialize the database**

   ```bash
   pnpm db:init
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:init` - Initialize database with sample data

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with better-sqlite3
- **Authentication**: NextAuth.js with credentials provider
- **Charts**: Recharts for data visualization
- **State Management**: TanStack Query (React Query)
- **Build Tool**: Next.js built-in tooling

## 📁 Project Structure

```
cofi/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard page
│   │   ├── transactions/   # Transactions management
│   │   └── statistics/     # Analytics and charts
│   ├── components/         # React components
│   ├── lib/              # Utilities and configurations
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
└── prisma/              # Database schema
```

## 🔐 Authentication

CoFi uses a simple PIN-based authentication system designed for couples:

- Each user has a unique 4-digit PIN
- Users can change their PIN in User Management
- Transactions can be marked as private (visible only to the creator) or public (visible to both users)

## 📊 Analytics Features

- **Monthly Overview**: Income, expenses, and net balance
- **Category Spending**: Track spending by categories
- **Trend Analysis**: Visualize financial trends over time
- **Privacy Controls**: Choose what data to share vs keep private

## 🐳 Docker Support

### Development with Docker

```bash
# Using Docker Compose for development
docker-compose -f docker-compose.dev.yml up
```

### Production Deployment

```bash
# Build and run production container
docker build -t cofi .
docker run -p 3000:3000 cofi
```

## 🚀 Self-Hosted Deployment

CoFi is designed for self-hosting to keep your financial data private and under your control.

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Docker Deployment

```bash
# Build production image
docker build -t cofi .

# Run with persistent volume for database
docker run -d \
  -p 3000:3000 \
  -v /path/to/data:/app/data \
  -e NEXTAUTH_SECRET=your-secret \
  --name cofi \
  cofi
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide React](https://lucide.dev/)
- Database with [SQLite](https://sqlite.org/)

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/zackszhu/CoFi/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/zackszhu/CoFi/discussions)
- 📧 **Email**: <me@zcj.io>

---

**Made with ❤️ for couples who want to build a healthy financial future together.**
