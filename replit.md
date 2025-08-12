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
- Phase 9: Master Salary Configuration Settings Standardization (✅ Completed)
  - Standardized toggle functionality across all Tax Exemption items (8 items)
  - Added Settings buttons with statutory checkbox toggles for all Deduction items
  - Consistent behavior: Settings buttons show/hide EPF/SOCSO/EIS/HRDF/PCB39/Fixed checkboxes
  - Uniform interface between Tax Exemption and Deduction sections
  - Items affected: Advance, PCB38, Zakat, Other Deduction for Deduction section
  - Complete functionality parity achieved across both major sections
- Phase 10: Comprehensive Checkbox Logic Integration (✅ Completed)
  - Implemented full checkbox flag logic for statutory calculations
  - EPF/SOCSO/EIS/HRDF wage bases now properly filter based on checkbox flags
  - Both Additional Items and Deduction Items flags integrated into calculations
  - PCB39 checkbox logic: ticked items included in taxable income calculation
  - Fixed checkbox: ensures amounts remain fixed monthly (automatic processing)
  - Malaysia-compliant PCB39 implementation following LHDN regulations
- Phase 11: Complete Claim Workflow with Real-Time Dashboard Integration (✅ Completed)
  - Fixed authentication token standardization ('utamahr_token') across all components
  - Resolved dateSubmitted validation errors with proper string-to-Date preprocessing
  - Enhanced claim approval page to display employee names instead of UUIDs
  - Updated pending approval statistics to show real database counts
  - Complete workflow: Submit → Database → Approval page → Dashboard statistics
  - Claims now appear immediately in /approval/claim with proper employee identification
- Phase 12: Multi-Level Approval Workflow Implementation (✅ Completed)
  - Implemented dynamic approval logic based on approval settings configuration
  - Single approver setup: Direct approval/rejection to final status
  - Dual approver setup: First approval becomes "awaitingSecondApproval" status
  - Enhanced status badges to display "Awaiting Second Approval" for multi-level workflows
  - Proper rejection handling: Any level rejection results in immediate "rejected" status
  - Added "Overtime" section to employee salary details with statutory checkbox controls
- Phase 13: Comprehensive Payroll System Implementation (✅ Completed)
  - Complete payroll database schema with PayrollDocument and PayrollItem tables
  - Full backend API for payroll document and item management with role-based access control
  - Automated payroll generation calculating overtime, claims, statutory deductions (EPF/SOCSO/EIS)
  - Malaysia-compliant calculations following official rates and ceilings
  - Frontend Payroll Management page with gradient theme and intuitive document/item management
  - Integration with existing overtime claims and financial claims for accurate payroll processing
  - Navigation integration in sidebar under Payment section
- Phase 14: System Debugging and Logical Workflow Improvement (✅ Completed)
  - Fixed critical database connection errors with improved connection pool handling
  - Resolved authentication issues in salary payroll page with proper useAuth hook implementation
  - Improved payroll document viewing logic to allow approval workflow (view before approve)
  - Fixed server startup issues and environment configuration validation
  - Enhanced error handling and connection stability for production reliability
- Phase 15: Comprehensive Payroll Detail Table Enhancement (✅ Completed)
  - Enhanced payroll detail page with complete table structure showing both summary and detailed breakdown
  - Added original columns: Name, Salary, Additional, Gross, Deduction, Contribution
  - Implemented detailed breakdown columns: EPF, SOCSO, EIS, PCB (employee contributions), EPF, SOCSO, EIS, HRDF (employer contributions)
  - Color-coded employee contributions (cyan background) and employer contributions (yellow background)
  - Added Net Salary column as final data column before Status and Action
  - Enabled horizontal scrolling with proper minimum width constraints for optimal viewing
  - Successfully displays real employee payroll data from database for month 7 (kamal ludin, SYED MUHYAZIR HASSIM, maryam maisarah)
- Phase 16: Professional HTML Template-Based PDF Payslip Generation (✅ Completed)
  - Migrated from problematic pdf-lib coordinate approach to reliable HTML template method
  - Implemented exact HQ layout template with professional styling and proper structure
  - Created dynamic template system with placeholder replacement for all payroll data
  - Added conditional rendering for income/deduction items (only show when amount > 0)
  - Integrated with existing Puppeteer configuration for consistent PDF generation
  - Successfully generates production-ready payslips matching reference template format exactly
  - Verified successful PDF generation with 39KB output size for SYED MUHYAZIR HASSIM payslip
- Phase 17: Excel Template-Based Payslip Generation System (🔄 In Progress)
  - Implemented ExcelJS library for Excel-based payslip generation using HQ template layout
  - Created dual-format payslip system supporting both PDF (HTML-to-PDF) and Excel downloads
  - Added Excel download button with FileSpreadsheet icon alongside existing PDF button
  - Developed professional HQ Excel layout with company details, employee information, and payroll calculations
  - Implemented Malaysian currency formatting (RM format) for consistent presentation
  - Added /api/payroll/payslip/:itemId/excel endpoint for server-side Excel generation
  - Frontend integration includes handleGenerateExcel function with proper file download handling

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