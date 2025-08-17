# Overview
UtamaHR is a comprehensive HR Management System built with React, TypeScript, and Express.js. The project's core purpose is to provide a secure, full-featured HR solution, starting with robust authentication and expanding to cover all essential HR functionalities. Key capabilities include secure JWT-based authentication, complete employee management (CRUD), detailed system settings with a modern UI, standardized employee detail layouts, real-time dashboard statistics, unread announcement tracking, comprehensive financial claim policy management, multi-level claim approval workflows with filtering and pagination, and a complete payroll system including PDF and Excel payslip generation with dynamic company data integration. The business vision is to deliver an intuitive and compliant HR platform capable of handling complex HR workflows.

## Recent Updates (August 2025)
- Successfully implemented voucher PDF generation using HTML template + Puppeteer approach
- Fixed __dirname ES module compatibility issues in voucher PDF generator
- Voucher PDF system now uses identical working technique as payroll system
- Payment voucher downloads generate proper PDF files with complete formatting
- Fixed claim approval pagination displaying incorrect "0 to 0 of 0 entries" in Report tab
- Implemented proper pagination logic showing actual filtered data counts
- Synchronized filter functionality across Summary and Report tabs
- Enhanced data integrity with consistent Malaysian language formatting
- Resolved controlled/uncontrolled input warnings in filter components
- Fixed HRDF not capturing from Master Salary in payroll table - implemented generateContributionsFromMasterSalary function
- Confirmed existing payroll items need regeneration to apply new HRDF capture logic
- RESOLVED: HTML preview layout matching PDF - created simplified template (payslip-html-simple.ts) with exact inline styling and font sizes matching PDF output
- RESOLVED: YTD HRDF display system - implemented complete YTD capture, template data structure, and conditional display logic (>0.01) for HRDF in employer contributions section
- **RESOLVED: MTD/PCB Storage Issue (August 16, 2025)** - Fixed critical bug in generateDeductionsFromMasterSalary function where Master Salary's 'other' field (containing MTD/PCB values) was incorrectly mapped to customItems array instead of direct storage. Now properly captures deductions.other value as string for accurate payroll calculations.
- **RESOLVED: My Record Download Integration (August 16, 2025)** - Successfully implemented My Record payslip download to use identical logic as main payroll system's green download button. Fixed import issues and function calls to use buildPdfPropsFromTemplateData from PayslipPDFDocument component. Downloads now show correct employee data, salary amounts, and calculations for each user's personalized payslip.
- **RESOLVED: Holiday Management System Simplification (August 17, 2025)** - Simplified holiday management system by removing Public Holiday checkbox column from table as per user requirement. All holidays entered in the system now automatically become public holidays and display with red background indicators in calendar. Updated both inline Add Holiday functionality and separate Add Holiday modal to automatically set isPublic: true for all new holidays.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite.
- **UI Components**: shadcn/ui with Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Authentication**: Context-based auth provider with protected routes.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database ORM**: Drizzle ORM for PostgreSQL.
- **Authentication**: Passport.js with local strategy (bcrypt-style hashing).
- **Session Management**: Express sessions.
- **API Design**: RESTful endpoints prefixed with `/api`.

## Database Design
- **Database**: PostgreSQL (configured via Drizzle).
- **Schema**: User table (id UUID, unique username, password).
- **Migrations**: Managed through Drizzle Kit.

## Authentication & Authorization
- **Strategy**: Session-based authentication using Passport.js.
- **Password Security**: Scrypt hashing.
- **Session Storage**: Configurable session store.
- **Frontend Protection**: Route-level protection with redirects.
- **API Security**: Session validation for protected endpoints.

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