# TraqOps

**Asset & Maintenance Management System**

A production-ready React application for enterprise asset, maintenance, inventory, and operations management built with React 18, Vite, Material UI, Ant Design, and Recharts.

## Tech Stack

### Core
- React 18
- Vite
- React Router v6
- Axios

### UI Libraries
- Material UI (MUI) - Layout, forms, cards, dialogs
- Ant Design (AntD) - Tables, pagination, filters, date pickers
- Ant Design Icons
- MUI Icons

### Charts & Visualization
- Recharts - Responsive charts with smooth animations

### Utilities
- dayjs - Date handling
- lodash - Data utilities
- clsx - Conditional classes
- react-hook-form - Forms
- yup - Validation

## Features

- **Dashboard**: KPI cards, maintenance status charts, inventory stock visualization, and recent activity table
- **Corrective Maintenance**: Ticket management with filters, status tracking, and detailed views
- **Scheduled Maintenance**: Maintenance schedule management with frequency tracking
- **Inventory**: Stock management with low stock alerts and value tracking
- **Reports**: Analytics and reporting with interactive charts
- **Invoices**: Invoice management with approval workflow
- **Documents**: Document management with category filtering
- **Master Settings**: Configuration management for categories, priorities, locations, and suppliers

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Login
Use any email and password to login (demo mode - no authentication required)

## Branding

- **Product Name**: TraqOps
- **Tagline**: Asset & Maintenance Management System
- **Company**: TraqOps Team

## Project Structure

```
src/
 ├── app/              # App configuration and routing
 ├── pages/            # Page components
 ├── components/       # Reusable components
 │    ├── mui/         # MUI-specific components
 │    ├── antd/        # AntD-specific components
 │    ├── charts/      # Chart components
 │    └── layout/      # Layout components
 ├── mock/             # Mock data JSON files
 ├── services/         # API service layer
 ├── context/          # React context providers
 ├── hooks/            # Custom React hooks
 ├── styles/           # Global styles
 └── main.jsx          # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Mock Data

The application uses mock data stored in JSON files in the `src/mock/` directory. Each module has its own data file:
- `dashboard.json` - Dashboard KPIs and charts data
- `correctiveMaintenance.json` - Corrective maintenance tickets
- `scheduledMaintenance.json` - Scheduled maintenance plans
- `inventory.json` - Inventory items and stock levels
- `reports.json` - Reports and analytics data
- `invoices.json` - Invoice records
- `documents.json` - Document library
- `masterSettings.json` - Master data configuration

## Design Principles

- **Enterprise Dashboard Look**: Professional, clean interface
- **Consistent Spacing & Typography**: MUI theme system
- **MUI for Structure**: Layout, navigation, cards, dialogs
- **AntD for Data**: Tables, pagination, filters, date pickers
- **Recharts for Visualization**: Responsive charts with gradients and animations
- **No UI Experimentation**: Stable, proven UI patterns

## Routes

- `/login` - Login page
- `/dashboard` - Main dashboard
- `/corrective-maintenance` - Corrective maintenance tickets
- `/scheduled-maintenance` - Scheduled maintenance plans
- `/inventory` - Inventory management
- `/reports` - Reports and analytics
- `/invoices` - Invoice management
- `/documents` - Document library
- `/master-settings` - Master data configuration

## Protected Routes

All routes except `/login` are protected and require authentication. Users are redirected to login if not authenticated.

## Future Enhancements

- Real API integration
- User authentication and authorization
- Real-time updates
- Advanced filtering and search
- Export functionality
- Print reports
- Mobile responsive optimizations

## License

This project is proprietary software.
