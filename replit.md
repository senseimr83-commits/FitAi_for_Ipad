# FitSync Pro - Advanced Health Metrics Dashboard

## Overview

FitSync Pro is a comprehensive fitness and health tracking application that integrates with Google Fit to provide deep insights into biometric data. The application visualizes complex health metrics through advanced charts and provides AI-powered insights to help users understand correlations between sleep, recovery, nutrition, and workout performance.

**Core Purpose:** Transform raw fitness data into actionable insights by revealing patterns and correlations across multiple health dimensions (sleep quality, heart rate variability, nutrition, recovery, and workout intensity).

**Key Features:**
- Google Fit integration for automated data synchronization
- Advanced data visualizations (Recovery Radar, Nerve Check, MindShield, Fuel Analyzer, Sync Index)
- AI-powered daily insights using OpenAI
- Real-time biometric tracking and analysis
- Readiness and recovery score calculations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript using Vite as the build tool

**UI Component System:**
- **shadcn/ui** with Radix UI primitives for accessible, customizable components
- **Tailwind CSS v4** (using `@import "tailwindcss"` directive) with custom design tokens
- **CSS Variables** for theming with dark mode by default
- **Framer Motion** for animations and transitions (note: dependency was removed but components still reference it)

**State Management:**
- **TanStack Query (React Query)** for server state management, data fetching, and caching
- Local React state for UI-specific state
- Custom hooks pattern for shared logic (`useAuth`, `useFitnessData`, `useGoogleFit`)

**Routing:** Wouter for lightweight client-side routing

**Design System:**
- Custom color palette: Neon Lime primary (#ccff00), Electric Blue secondary, Hot Pink accent
- Dark theme with glass morphism effects
- Custom fonts: Inter (body), Outfit (display), Space Grotesk (mono)
- Responsive design with mobile-first approach

**Chart Library:** Recharts for data visualization with custom-styled components

**Code Organization:**
- `/client/src/components` - Reusable UI components
- `/client/src/pages` - Page-level components
- `/client/src/hooks` - Custom React hooks
- `/client/src/lib` - Utility functions and API client
- `/shared` - Shared types and schemas between client and server

### Backend Architecture

**Framework:** Express.js with TypeScript running on Node.js

**API Design:** RESTful API with JSON responses

**Authentication:** 
- Replit Auth using OpenID Connect (OIDC)
- Passport.js strategy for authentication flow
- Session-based authentication with connect-pg-simple for session storage
- Protected routes using `isAuthenticated` middleware

**Database ORM:** Drizzle ORM with PostgreSQL dialect

**Server Structure:**
- Development server (`index-dev.ts`) with Vite middleware for HMR
- Production server (`index-prod.ts`) serving static files
- Modular route registration in `routes.ts`
- Separated business logic in dedicated modules (`storage.ts`, `googleFit.ts`, `aiInsights.ts`)

**Key Endpoints:**
- `/api/auth/user` - Get authenticated user
- `/api/google-fit/connect` - Initiate OAuth flow
- `/api/google-fit/callback` - OAuth callback handler
- `/api/google-fit/sync` - Sync fitness data
- `/api/fitness-metrics` - Retrieve fitness metrics
- `/api/insights/latest` - Get latest AI insight

### Data Layer

**Database:** PostgreSQL (via Neon serverless)

**Schema Design:**
```
sessions - Session storage for Replit Auth
users - User profiles (id, email, firstName, lastName, profileImageUrl)
google_fit_tokens - OAuth tokens for Google Fit API (with refresh token support)
fitness_metrics - Daily health metrics (RHR, HRV, sleep scores, nutrition, activity)
insights - AI-generated insights (content, type, read status)
```

**Data Storage Pattern:**
- Interface-based storage layer (`IStorage`) for abstraction
- `DatabaseStorage` class implements all database operations
- Drizzle ORM for type-safe queries
- Upsert pattern for idempotent metric updates

**Metric Calculation:**
- Readiness Score: Weighted combination of sleep (40%), recovery (30%), HRV (30%)
- Strain Score: Based on workout intensity and step count
- Sync Index: Multi-dimensional score across recovery, HRV, and sleep

### External Dependencies

**Third-Party Services:**

1. **Google Fit API**
   - OAuth 2.0 authentication flow
   - Scopes: fitness.activity, heart_rate, sleep, nutrition, body
   - Data fetching for multiple health dimensions
   - Token refresh mechanism for long-term access

2. **OpenAI API**
   - Model: GPT-4o-mini
   - Purpose: Generate personalized daily insights
   - Input: Last 7 days of fitness metrics
   - Output: 2-3 sentence actionable insights focused on correlations

3. **Replit Auth (OIDC)**
   - Identity provider for user authentication
   - Claims-based user profile (sub, email, name)
   - Session management with PostgreSQL backing

4. **Neon Database**
   - Serverless PostgreSQL provider
   - Connection via `@neondatabase/serverless` driver
   - Environment variable: `DATABASE_URL`

**APIs and Integrations:**
- Google OAuth 2.0 for Fit API access
- OpenAI Chat Completions API for insights
- Replit OIDC discovery endpoint

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL
- `ISSUER_URL` - OIDC issuer URL
- `REPL_ID` - Replit deployment identifier

**Build and Deployment:**
- Vite for frontend bundling with React plugin
- esbuild for backend bundling (ESM format)
- Production build outputs to `/dist` directory
- Custom Vite plugins for Replit integration and meta image updates