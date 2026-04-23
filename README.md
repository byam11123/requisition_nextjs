# Requisition App (Next.js Version)

A modern, full-stack Requisition Management System built with Next.js, featuring a premium glassmorphic UI and robust role-based access control.

## Architecture

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling**: Vanilla CSS + [Tailwind CSS](https://tailwindcss.com) 
- **Icons**: [Lucide React](https://lucide.dev)
- **Authentication**: JWT-based session management
- **Security**: Argon2/Bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL (or use the built-in dev-bypass store for testing)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd requisition-app-next
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/requisition_db"
   JWT_SECRET="your-super-secret-key"
   ```

4. **Initialize Database** (Optional):
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Role-based Access Control (RBAC)**
  - **Purchaser**: Creates/submits requisitions, uploads bills/material proofs, marks as dispatched.
  - **Manager**: Processes approvals (Approve / Reject / Hold / To Review) with notes.
  - **Accountant**: Updates payment status (Done / Partial / Not Done), UTR numbers, and uploads payment proof.
  - **Admin**: Full system management, user administration, and bulk delete capabilities.

- **Status Timeline**
  - Real-time visualization of the requisition lifecycle: **Submitted → Approved → Paid → Dispatched**.
  - Detailed audit logs including who performed each action and when.

- **Advanced Attachment Handling**
  - **Instant Local Previews**: Immediate visual feedback for uploads using Blob URLs.
  - **Persistent Storage**: Files are saved to `public/uploads/` and served as static assets.
  - Supports: Bills/Invoices, Vendor QR/Payment details, Payment Proof, and Material Proof.

- **Aesthetic Dashboard**
  - Premium Glassmorphism design system.
  - Compact Stat Cards with horizontal layout for better space utilization.
  - Clickable Table Rows with deep linking on Request IDs.
  - Advanced search and multi-layer filtering.

## User Guide

### 1. Typical Workflow
- **Purchaser**: Dashboard → New Requisition → Fill Details → Submit.
- **Manager**: View Requisition → Process Approval → Set Status + Notes.
- **Accountant**: View Requisition → Update Payment → Enter UTR/Amount → Upload Proof.
- **Purchaser**: View Requisition → Mark as Dispatched → Upload final proofs.

### 2. Available Test Accounts
- **Admin**: `admin@example.com` / `password123`
- **Manager**: `manager@example.com` / `password123`
- **Purchaser**: `purchaser@example.com` / `password123`
- **Accountant**: `accountant@example.com` / `password123`

---

*This project is a migration of the original Spring Boot / React Requisition App.*
