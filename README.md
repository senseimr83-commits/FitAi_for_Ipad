# FitSync Pro - Advanced Health Metrics Dashboard

A comprehensive fitness and health tracking application that integrates with Google Fit to provide deep insights into biometric data through advanced visualizations and AI-powered analysis.

## Features

- 🔗 **Google Fit Integration** - Automated data synchronization
- 📊 **Advanced Visualizations** - Recovery Radar, Nerve Check, MindShield, and more
- 🤖 **AI-Powered Insights** - Daily personalized insights using OpenAI GPT-4o
- 📱 **PWA Ready** - Install as native app on iPad/mobile
- 🔄 **Real-time Sync** - Live biometric tracking and analysis
- 📈 **Correlation Analysis** - Discover patterns between sleep, recovery, and performance

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite build tool
- shadcn/ui + Radix UI
- Tailwind CSS v4
- TanStack Query
- Recharts for data visualization

**Backend:**
- Express.js + TypeScript
- PostgreSQL with Drizzle ORM
- Google Fit API integration
- OpenAI API integration
- Session-based authentication

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see DEPLOYMENT.md)
4. Run development server: `npm run dev`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Railway, Render, or other platforms.

## Architecture

- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript schemas
- Advanced biometric analysis with correlation calculations
- PWA with offline capabilities

Built with ❤️ for health and fitness enthusiasts.