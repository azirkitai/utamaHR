# Overview

UtamaHR - A comprehensive HR Management System built from scratch with React, TypeScript, and Express.js. This project focuses on secure authentication first, then expanding to full HR functionality. Currently implementing JWT-based authentication with username/password login, proper route protection, and production-ready deployment.

## Project Status
- Phase 1: Authentication System (✅ Completed)
  - JWT token-based authentication
  - Username/password login with test account (Azirkitai/test1234)
  - Route protection and redirects
  - Production-ready implementation
- Phase 2: Employee Management (✅ Completed) 
  - Full CRUD operations for employees
  - PostgreSQL database integration
  - Protected admin functions
  - Status tracking and form validation
- Phase 3: System Settings with Modern Gradient Theme (✅ Completed)
  - All System Setting modules with beautiful gradient theme (#07A3B2 to #D9ECC7)
  - Yearly Form Settings with EA Person In Charge dropdown functionality
  - Complete attendance management with location tracking and shift scheduling
  - Professional gradient styling applied to all headers, buttons, and navigation
- Phase 4: Employee Details Layout Standardization (✅ Completed)
  - Unified grid layout system across all tabs (Personal Details, Employment, Contact)
  - Consistent pattern: grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5
  - Standardized field spacing, label formatting, and input heights
  - Professional gradient theme applied to all card headers
- Phase 5: Real-Time Dashboard Statistics & Leave Records Integration (✅ Completed)
  - Dashboard shows actual clock-in statistics from database (today's count: 1)
  - User-specific leave statistics showing total approved leave days from database
  - My Record page displays actual leave applications with proper status badges
  - Complete database integration for leave balance calculations and record displays
- Phase 6: Unread Announcement Tracking System (✅ Completed)
  - Added announcement_reads table to track user-specific read status
  - Real-time unread count badge displayed on "Unread" tab
  - Mark-as-read functionality when users view announcements
  - Automatic removal of read announcements from unread list
  - Persistent read status across user sessions with database storage
  - Enhanced UI with "NEW" badges for unread announcements
- Phase 7: Financial Claim Policy Database Integration (✅ Completed)
  - Complete financial_claim_policies table with CRUD operations
  - Full-stack integration from System Setting configuration to Apply Claim dropdown
  - Dynamic dropdown population from database policies (enabled policies only)
  - Real-time form management with save/cancel functionality
  - Dropdown "Claim Type" now shows company-configured Financial Policies
  - Seamless connection between policy configuration and claim application
- Phase 8: Employee Claim Policy Management (✅ Completed)
  - Employee Details Claim Policy tab now displays company's financial policies
  - Toggle switch functionality to include/exclude individual employees from policies
  - System policies indicator showing these are configured in Settings
  - Employee exclusion API endpoint for policy-level access control
  - When toggle is off, employee loses access to that specific benefit policy
  - Complete integration between System Settings policies and Employee Details view

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with protected routes

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Authentication**: Passport.js with local strategy using bcrypt-style password hashing
- **Session Management**: Express sessions with configurable storage (currently using in-memory store)
- **API Design**: RESTful endpoints prefixed with `/api`

## Database Design
- **Database**: PostgreSQL (configured via Drizzle)
- **Schema**: User table with id (UUID), username (unique), and password fields
- **Migrations**: Managed through Drizzle Kit with migrations stored in `/migrations` directory

## Authentication & Authorization
- **Strategy**: Session-based authentication using Passport.js
- **Password Security**: Scrypt hashing with salt for password storage
- **Session Storage**: Configurable session store (memory store for development, can be switched to PostgreSQL)
- **Frontend Protection**: Route-level protection with redirect to auth page for unauthenticated users
- **API Security**: Session validation for protected endpoints

## Development & Build Process
- **Development**: Hot module replacement with Vite dev server
- **Production Build**: Vite builds frontend to `/dist/public`, esbuild bundles backend to `/dist`
- **TypeScript**: Strict mode enabled with path aliases for clean imports
- **Environment**: Development/production environment detection

## Code Organization
- **Shared Code**: `/shared` directory contains database schema and types shared between frontend and backend
- **Frontend**: `/client` directory with organized components, pages, hooks, and utilities
- **Backend**: `/server` directory with route handlers, authentication, and storage abstractions
- **Component Structure**: Atomic design with reusable UI components in `/client/src/components/ui`

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-zod**: Integration between Drizzle and Zod for schema validation

## Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives for accessible components
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolvers
- **wouter**: Lightweight client-side routing
- **tailwindcss**: Utility-first CSS framework
- **zod**: TypeScript-first schema validation

## Backend Dependencies
- **passport**: Authentication middleware
- **passport-local**: Local authentication strategy
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking and compilation
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development

## UI & Styling Dependencies
- **class-variance-authority**: Utility for creating component variants
- **clsx**: Conditional className utility
- **tailwind-merge**: Tailwind class merging utility
- **lucide-react**: Icon library
- **date-fns**: Date manipulation library