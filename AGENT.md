# AGENT.md - Personal Finance App Development Rules

## Project Overview
Next.js personal finance management app with transaction tracking, statistics, and user management.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Auth**: NextAuth.js
- **Database**: SQLite (via better-sqlite3)
- **ORM**: Custom queries with prepared statements

## Key Conventions

### File Structure
```
src/
  app/           # Next.js app directory (routes)
  components/    # React components (ui/ for shadcn components)
  lib/          # Utilities, database, types
  hooks/        # Custom React hooks
```

### Database Patterns
- Use `lib/db.ts` for database connection
- Prepared statements in `lib/queries.ts`
- Types defined in `lib/types.ts`
- Database initialization in `lib/db/init-db.ts`

### API Routes
- RESTful structure in `app/api/`
- Route handlers use async functions
- Return JSON responses with proper HTTP status codes
- Authentication checks via NextAuth

### Component Patterns
- Use shadcn/ui components from `components/ui/`
- Client components marked with 'use client'
- Server components by default
- Props interfaces in same file

### Styling
- Tailwind CSS utility classes
- Dark mode support via class-based strategy
- Consistent spacing using Tailwind scale
- Component variants via class-variance-authority

### TypeScript
- Strict mode enabled
- No implicit any
- Prefer interfaces over types
- Use proper return types for API routes

## Development Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Testing Approach
- Manual testing via UI
- Database operations tested via API routes
- Check responsive design on mobile/desktop

## Security Notes
- Never log sensitive data
- Validate all user inputs
- Use prepared statements for DB queries
- Implement proper auth checks on API routes