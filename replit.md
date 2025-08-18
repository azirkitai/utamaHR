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
- **RESOLVED: Login Page Design Overhaul (August 17, 2025)** - Completely redesigned login page with centered card layout, dark blue gradient background (slate-900 via blue-900 to cyan-800), and implemented new Utama HR logo from user assets. Removed registration tab as system is private and doesn't require public registration. Enhanced with backdrop blur effects and modern gradient button styling matching platform theme.
- **RESOLVED: Universal Gradient Standardization (August 17, 2025)** - Successfully standardized ALL gradients across the entire platform to match auth page theme (from-slate-900 via-blue-900 to-cyan-800). Updated 30+ files using batch processing commands to replace various gradient patterns including cyan-blue, red, purple, and custom hex gradients. Platform now maintains complete visual consistency with dark blue gradient theme throughout all components, buttons, cards, and UI elements.
- **RESOLVED: Role-Based Access Control Implementation (August 17, 2025)** - Implemented comprehensive role-based navigation access control in sidebar. Administration section restricted to Super Admin, Admin, and HR Manager roles only. Payment module specifically accessible to Finance role in addition to privileged roles. Added authentication integration using useQuery hooks for user and employee data. Console logging added for debugging role access. System automatically filters navigation items based on user role permissions.
- **RESOLVED: QR Clock-in Smart Detection & Auto Refresh System (August 17, 2025)** - Enhanced QR Clock-in page with intelligent status detection and real-time auto refresh capabilities. Implemented new API endpoint `/api/today-attendance-status` for real-time attendance status checking. QR card now automatically displays "Clock-Out" mode when user already clocked-in, with dynamic orange gradient styling. Added completion status display when both clock-in and clock-out are done. System refreshes every 3-5 seconds with additional triggers on window focus and visibility changes. Auto-clearing of QR tokens after successful clock-in/out with immediate toast notifications for user feedback. Updated sidebar navigation label from "QR Clock-In" to "QR Clock-In/Out" reflecting enhanced functionality.
- **RESOLVED: Mobile Clock-in JavaScript Error Fix & Cross-page Synchronization (August 17, 2025)** - Fixed critical JavaScript errors in mobile clock-in page after clock-out operations by updating interface to handle different API response structures for clock-in vs clock-out scenarios. Implemented localStorage-based cross-page communication system where mobile operations trigger immediate refresh on main QR Clock-In/Out page. Enhanced mobile page to display appropriate success messages and data for both clock-in ("Clock-In Berjaya!") and clock-out ("Clock-Out Berjaya!" with total hours) scenarios. Added proper error handling for undefined clockInRecord access patterns.
- **RESOLVED: Employee Role Display Fix (August 17, 2025)** - Fixed employee management table to display actual employee roles from database instead of generic "Employee" text. System now shows correct roles like "Staff/Employee", "Admin", etc. as stored in the employee.role field.
- **RESOLVED: Header User Profile Navigation (August 17, 2025)** - Enhanced dashboard header with clickable user name and avatar that redirects to employee details page. Added hover effects and smooth transitions for better user experience. Both name text and profile picture now serve as quick access to user's own profile page.
- **RESOLVED: LeavePolicyTab Role-Based Access Control (August 17, 2025)** - Implemented strict role-based access control for leave policy management switches. Only Super Admin, Admin, and HR Manager roles can modify leave policy inclusion status. Staff/Employee roles see "Access Restricted" message and disabled switches. Added current user authentication queries and privilege checking functions with debug logging for troubleshooting.
- **RESOLVED: ClaimPolicyTab Role-Based Access Control (August 17, 2025)** - Applied identical role-based access control to claim policy management switches. Restricted switch access to Super Admin, Admin, and HR Manager roles only. Staff/Employee users see "Access Restricted" message and disabled controls. Implemented proper TypeScript type definitions and debugging console logs for monitoring access control functionality.
- **RESOLVED: Calendar Page Role-Based Access Control Deployment Fix (August 17, 2025)** - Fixed deployment issue where Staff/Employee users could still see "Add Holiday" and "Add Event" buttons in calendar page despite role restrictions working in development. Enhanced role-based access control by implementing proper authentication queries (currentUser and currentUserEmployee) and updated canAccessHolidayButtons() and canAccessAddEvent() functions to use consistent role checking logic. Added debug logging for troubleshooting deployment role detection issues. Holiday management buttons now properly restricted to Super Admin, Admin, HR Manager, and PIC roles only.
- **RESOLVED: System-wide Role-Based Access Control Standardization (August 17, 2025)** - Implemented comprehensive audit and standardization of role-based access control across all major platform components. Fixed deployment vs development inconsistencies in Dashboard, Announcement, and My Record pages by replacing old role checking patterns with consistent authentication queries. All components now use standardized pattern: currentUserRole = currentEmployee?.role || currentUser?.role || '' with privilegedRoles arrays. Enhanced debug logging throughout platform for deployment troubleshooting. Ensured consistent role restrictions across Calendar, Dashboard, Announcement, My Record, Leave Policy, and Claim Policy management features.
- **RESOLVED: Comprehensive Multi-Currency System (August 18, 2025)** - Expanded currency selection to support 20 different currencies including all ASEAN countries (Malaysia RM, Indonesia IDR, Thailand THB, Singapore SGD, Myanmar MMK, Philippines PHP, Vietnam VND, Brunei BND, Laos LAK, Cambodia KHR) plus major international currencies (USD, EUR, GBP, JPY, CNY, KRW, INR, AUD, CAD, HKD). Each currency displays full name for clarity in Payment Settings.
- **RESOLVED: Global Statutory Contributions Control System (August 18, 2025)** - Implemented comprehensive admin-level control panel for all Malaysian statutory contributions in Payment Settings. Features individual on/off switches for EPF (Employee Provident Fund), SOCSO (Social Security Organization), EIS (Employment Insurance System), HRDF (Human Resources Development Fund), and PCB39 (Personal Income Tax). Each control includes color-coded icons, detailed explanations, and system-wide impact warnings. All switches use consistent platform gradient styling with blue-900 theme.
- **RESOLVED: React Hooks Violation Fix in System Settings (August 18, 2025)** - Fixed critical "Rendered more hooks than during the previous render" error in system-setting-page.tsx by moving useState and useEffect hooks from nested render function (renderOvertimeSettingsForm) to top-level component. Renamed localSettings to localOvertimeSettings to avoid naming conflicts. All complex System Settings functionality restored including Company, Leave, Claim, Department, Overtime, and Payment configurations with proper hooks ordering compliance.

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