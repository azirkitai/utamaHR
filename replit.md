# Overview
UtamaHR is a comprehensive HR Management System built with React, TypeScript, and Express.js. Its core purpose is to provide a secure, full-featured HR solution, starting with robust authentication and expanding to cover essential HR functionalities. Key capabilities include secure JWT-based authentication, complete employee management (CRUD), detailed system settings, standardized employee detail layouts, real-time dashboard statistics, unread announcement tracking, comprehensive financial claim policy management with multi-level approval workflows, complete payroll system including PDF and Excel payslip generation with dynamic company data integration, and advanced shift management system with per-date assignment capabilities, manual state tracking, and database persistence through Save button workflow. The business vision is to deliver an intuitive and compliant HR platform capable of handling complex HR workflows including sophisticated shift scheduling.

**CRITICAL MILESTONE IN PROGRESS (August 2025)**: Comprehensive language standardization to English underway across the entire application. Major components completed include QR Clock-in system, employee management pages, authentication system, and error messages. Remaining work focuses on mobile clock-in/out pages and a few remaining user interface elements. All compliance messages now display standardized English format: "Late X hours Y minutes from shift time Z. Needs supervisor review." Core system now displays professional English throughout most components.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite.
- **UI Components**: shadcn/ui with Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables. A universal dark blue gradient theme (from-slate-900 via-blue-900 to-cyan-800) is standardized across the entire platform.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Authentication**: Context-based auth provider with protected routes.
- **UI/UX Decisions**: Redesigned login page with centered card layout and new logo. Standardized visual gradients. Enhanced header with clickable user profile. Red background indicators for public holidays in calendar. Dynamic QR card styling for clock-in/out.
- **Feature Specifications**:
    - Comprehensive multi-currency support (20 currencies including ASEAN and major international).
    - Global statutory contributions control panel (EPF, SOCSO, EIS, HRDF, PCB39) with on/off switches.
    - Simplified holiday management: all holidays are public.
    - Forms management system with file upload/download capabilities.
    - Role-based access control implemented for navigation, leave/claim policy management, calendar buttons, and other sensitive components.
    - Enhanced QR Clock-in/Out with intelligent status detection, real-time auto refresh, and cross-page synchronization for mobile operations.
    - Professional PDF report generation for leave records using pdf-lib library approach with enhanced styling, company branding, IC number display, and applicant name column.
    - Enhanced attendance PDF reports with dynamic company branding: automatically fetches company settings (logo placeholder, name, phone, email, address) from System Settings for professional header formatting with expanded layout.
    - Comprehensive filtering and PDF download system across all My Record tabs (Leave, Claim, Overtime) with reusable filter components (`renderLeaveFilterSection`, `renderClaimFilterSection`, `renderOvertimeFilterSection`) ensuring UI consistency.
    - Advanced client-side filtering with date range selection, status filtering, claim type filtering, and search functionality with proper state management and connected dropdowns.
    - **Complete Language Standardization (August 2025)**: Systematic conversion from mixed Malay-English to professional English throughout the application including UI elements, PDF reports, compliance messages, server responses, and error handling with standardized attendance compliance messaging format: "Late X hours Y minutes from shift time Z. Needs supervisor review."

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM for PostgreSQL.
- **Authentication**: Passport.js with local strategy (bcrypt-style hashing).
- **Session Management**: Express sessions.
- **API Design**: RESTful endpoints prefixed with `/api`.
- **Technical Implementations**:
    - Voucher and Payslip PDF generation uses HTML template + Puppeteer approach.
    - Payroll system accurately captures MTD/PCB and HRDF.
    - API endpoint `/api/today-attendance-status` for real-time attendance checking.
    - `/api/forms/download/:id` for secure file downloads.

## Database Design
- **Database**: PostgreSQL (configured via Drizzle).
- **Schema**: User table (id UUID, unique username, password).
- **Migrations**: Managed through Drizzle Kit.

## Authentication & Authorization
- **Strategy**: Session-based authentication using Passport.js.
- **Password Security**: Scrypt hashing.
- **Session Storage**: Configurable session store.
- **Frontend Protection**: Route-level protection with redirects.
- **API Security**: Session validation for protected endpoints, JWT Authorization headers for form operations.
- **Role-Based Access Control**: Comprehensive system-wide RBAC restricting access to features and UI elements based on user roles (Super Admin, Admin, HR Manager, Finance, Staff/Employee).

## Development & Build Process
- **Development**: Hot module replacement with Vite.
- **Production Build**: Vite builds frontend, esbuild bundles backend.
- **TypeScript**: Strict mode with path aliases.
- **Environment**: Development/production environment detection.

## Code Organization
- **Shared Code**: `/shared` for database schema and types.
- **Frontend**: `/client` with organized components, pages, hooks, utilities.
- **Backend**: `/server` with route handlers, authentication, storage abstractions.
- **Component Structure**: Atomic design with reusable UI components in `/client/src/components/ui`.

# External Dependencies

## Core Dependencies
- `@neondatabase/serverless`: Neon PostgreSQL driver.
- `drizzle-orm`: Type-safe ORM.
- `drizzle-zod`: Drizzle and Zod integration.

## Frontend Dependencies
- `@tanstack/react-query`: Server state management.
- `@radix-ui/*`: Headless UI primitives.
- `react-hook-form`: Form handling.
- `@hookform/resolvers`: Form validation resolvers.
- `wouter`: Client-side routing.
- `tailwindcss`: CSS framework.
- `zod`: Schema validation.

## Backend Dependencies
- `passport`: Authentication middleware.
- `passport-local`: Local authentication strategy.
- `express-session`: Session management.
- `connect-pg-simple`: PostgreSQL session store.
- `exceljs`: Excel file generation.
- `puppeteer`: PDF generation from HTML templates.

## UI & Styling Dependencies
- `class-variance-authority`: Component variants.
- `clsx`: Conditional className utility.
- `tailwind-merge`: Tailwind class merging.
- `lucide-react`: Icon library.
- `date-fns`: Date manipulation.