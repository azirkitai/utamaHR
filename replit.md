# Overview

This is a full-stack web application built with React, TypeScript, and Express.js. It appears to be an Employee Management System or HR Dashboard with authentication capabilities. The application uses a modern tech stack with shadcn/ui components for the frontend, Drizzle ORM for database operations, and session-based authentication.

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