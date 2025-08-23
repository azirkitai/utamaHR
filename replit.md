# Overview
UtamaHR is a comprehensive HR Management System built with React, TypeScript, and Express.js. Its core purpose is to provide a secure, full-featured HR solution, starting with robust authentication and expanding to cover essential HR functionalities. Key capabilities include secure JWT-based authentication, complete employee management (CRUD), detailed system settings, standardized employee detail layouts, real-time dashboard statistics, unread announcement tracking, comprehensive financial claim policy management with multi-level approval workflows, complete payroll system including PDF and Excel payslip generation with dynamic company data integration, and advanced shift management system with per-date assignment capabilities, manual state tracking, and database persistence through Save button workflow. The business vision is to deliver an intuitive and compliant HR platform capable of handling complex HR workflows including sophisticated shift scheduling.

**CRITICAL MILESTONE COMPLETED (August 2025)**: Comprehensive language standardization to English completed across the entire application. All components now display professional English including QR Clock-in system, employee management pages, authentication system, error messages, server responses, and user interface elements. All compliance messages display standardized English format: "Late X hours Y minutes from shift time Z. Needs supervisor review." Employee deletion functionality now fully operational with proper cascade deletion and authentication. Complete system now operates in professional English throughout all components.

**TECHNICAL DEBT RESOLUTION COMPLETED (August 2025)**: Comprehensive cleanup of server/storage.ts completed with systematic removal of all duplicate imports, identifiers, and method implementations. TypeScript compilation errors resolved through proper ES2017 target configuration with downlevelIteration support. All table reference conflicts fixed (disciplinary → disciplinaryRecords, overtimeClaims → claimApplications). LSP diagnostics completely cleared and build process optimized to 640.2kb bundle size. System stability restored with zero compilation errors.

**REACT RUNTIME ISSUES RESOLVED (August 2025)**: Fixed critical React runtime errors by correcting AuthProvider hierarchy and implementing proper Error Boundary components. Resolved "useAuth must be used within an AuthProvider" error through proper provider nesting order. Added React.StrictMode for development and comprehensive error handling. Application now runs without React Hook lifecycle issues and infinite re-renders.

**REACT MINIFIED ERROR #31 COMPLETELY RESOLVED (August 2025)**: Successfully identified and fixed the root cause of React Minified Error #31 ("Element type is invalid") on /approval/leave page. Issue was caused by department data structure returning objects {id, name, code, description, ...} while Select component expected strings. Fixed by updating department mapping from `dept: string` to `dept: any` and using `dept.name` for display values. Production builds now complete successfully (640.2kb) and all leave approval functionality operates without runtime errors.

**CRITICAL SHIFT CALENDAR MAPPING ISSUE RESOLVED (August 2025)**: Fixed major technical issue where shift calendar displayed shifts on wrong dates due to month/week view data contamination. Problem: system showed indices 0-30 (31 days) even in week mode, causing shifts to appear on incorrect calendar positions. Solution: Implemented forced week-only mode in getDatesForView() function, ensuring exactly 7 days (indices 0-6) are generated. Console logs now correctly show week view mapping with proper date-to-index relationships. Database integrity confirmed - shifts save correctly, issue was frontend display mapping only. Complete English language standardization applied to all shift calendar components including toast messages, error handling, and user interface elements.

**MALAYSIA TIMEZONE SYSTEM VERIFIED (August 2025)**: Comprehensively verified and confirmed that Malaysia timezone (UTC+8) is implemented correctly throughout the entire application. Backend stores UTC timestamps properly while frontend handles timezone conversion using Asia/Kuala_Lumpur timezone. All time displays across QR Clock-in page, Calendar page, and Dashboard consistently show Malaysia time. Standardized time format to 12-hour AM/PM format for consistency across all pages. System correctly converts UTC times to Malaysia time: UTC 09:30 → Malaysia 05:30 PM, UTC 05:50 → Malaysia 01:50 PM.

**SECURITY FEATURE VERIFIED (August 2025)**: Auto-logout security system fully operational - users are automatically logged out after 10 minutes of inactivity with 2-minute warning notification. System detects user activity (mouse movement, clicks, keyboard input, scrolling) and resets timers accordingly. This enhances security compliance and prevents unauthorized access to sensitive HR data.

**SECURITY ENHANCEMENT COMPLETED (August 2025)**: Role Configuration menu access now restricted to Super Admin users only. Non-Super Admin users (Admin, HR Manager, Finance, Staff/Employee) can no longer see or access the Role Configuration option in System Settings, ensuring proper security controls for user role management functionality.

**ACCESS CONTROL ENHANCEMENT (August 2025)**: Comprehensive employee management access control implemented. Employee Details "Back to Employee List" button now restricted to Super Admin and Admin roles only. Additionally, all employee action buttons (View, Edit, Delete, Add Employee) on the Employee Management page are now restricted to Super Admin and Admin roles, ensuring complete access control for employee management operations.

**REAL-TIME UPDATES COMPLETED (August 2025)**: Header role display now updates immediately when user roles are changed. Implemented comprehensive cache invalidation for employee updates including `/api/user/employee` and `/api/user` queries, ensuring role changes reflect instantly in the header display without requiring page refresh.

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