# CareSync - Patient & Doctor Portal (Frontend)

![Angular](https://img.shields.io/badge/Angular-19-dd0031?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![RxJS](https://img.shields.io/badge/RxJS-Reactive-B7178C?style=for-the-badge&logo=reactivex)

The **CareSync Frontend** is a modern, responsive Single Page Application (SPA) meticulously engineered to provide two distinct, role-optimized experiences within a single codebase: a smooth, accessible portal for **Patients** and a powerful, data-dense dashboard for **Doctors**.

---

## 🎨 UX/UI Engineering & Design

- **Role-Based Layouts**: Implemented a dynamic layout engine that serves completely different navigation structures and dashboards/themes based on the logged-in user's role (`Doctor` vs `Patient`) using Angular's content projection and routing.
- **Responsive & Adaptive**: Built with **TailwindCSS** mobile-first utility classes, ensuring a native-like experience on phones while leveraging large screen real-estate for complex data tables on desktops.
- **Interactive Dashboards**: Integrated **Chart.js** to visualize key metrics (Patient trends, Revenue, Appointment distributions) for data-driven decision making.

---

## 🔧 Technical Architecture & Patterns

### 🛡️ Secure Authentication & State
- **Reactive State Management**: Heavy usage of **RxJS BehaviorSubjects** in services to manage global state (User Session, Notifications, Theme Preference) without prop-drilling.
- **Http Interceptors**: Custom `TokenInterceptor` automatically attaches JWTs to outgoing requests and handles `401 Unauthorized` errors by triggering the refresh token flow seamlessly.
- **Route Guards**: `AuthGuard` and `RoleGuard` protect sensitive routes, ensuring users can only navigate to authorized areas.

### 🧩 Modular Design Philosophy
- **Feature Modules**: The codebase is architected into domain-specific modules (`Auth`, `Doctor`, `Patient`, `Shared`) to enforce separation of concerns and maintainability.
- **Reusable Components**: Created a library of "dumb" presentation components (Cards, Tables, Modals) in the `Shared` module to reduce code duplication and ensure design consistency.
- **Lazy Loading**: Route-level code splitting ensures fast initial load times by only downloading the chunks required for the current view.

### 📡 Real-Time Integration
- **WebSocket Client**: Integrated `@stomp/stompjs` to subscribe to personal notification topics, providing instant feedback (Toasts/Snackbars) when appointments are booked or statuses change.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Angular 19+ |
| **Language** | TypeScript |
| **Styling** | TailwindCSS, PostCSS |
| **Async Operations** | RxJS (Observables, Pipeable Operators) |
| **Data Viz** | Chart.js |
| **Build Tool** | Angular CLI / Vite |

---

## 🚀 Key Features

### For Patients
- **Smart Booking Flow**: 3-step wizard for selecting specialized doctors, choosing slots, and secure payment.
- **Medical Vault**: Access history, prescriptions, and lab reports.
- **Video Consultations**: Integrated interface for remote consultations.

### For Doctors
- **Practice Management**: Calendar view of daily appointments with drag-and-drop rescheduling (planned).
- **EMR Editor**: Rich text tools to write prescriptions and diagnosis notes.
- **Financial Analytics**: Revenue tracking and payout reports.

---
*Built by Vikrant - Demonstrating expertise in frontend architecture, component design, and reactive programming.*
