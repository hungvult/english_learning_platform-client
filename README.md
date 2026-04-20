# English Learning Platform - Client

This project is the frontend for the **English Learning Platform**, built with **Next.js 14** using the App Router. It serves two primary audiences:
1. **Students**: Gamified learning environment with interactive exercise interfaces.
2. **Administrators**: A robust CMS built with **React-Admin** for managing curriculum and exercise data.

## Getting Started

### Prerequisites
- **Node.js**: 20+
- **npm**: 10+

### Installation & Run
1. Create a `.env.local` file from `.env.example`.
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- **`app/`**: Next.js App Router root.
  - **`(auth)/`**: Login and Registration pages.
  - **`(main)/`**: Protected student routes (learning paths, practice).
  - **`admin/`**: The Administrative dashboard entry point.
- **`components/`**: UI component library.
  - **`admin/`**: Specialized components for CMS (e.g., `content-pages.tsx` for reordering logic).
  - **`game/`**: Game-specific UI elements (Hearts, XP, Streak bar).
  - **`lesson/`**: Interactive exercise quiz components.
- **`lib/`**: Business logic, hooks (`useSwapOrder`), and API fetch wrappers.
- **`store/`**: Zustand state management for progress and game state.
- **`types/`**: TypeScript interfaces shared across the application.
- **`config/`**: Global constants and feature flags.

## Key Features
- **Gamified Learning**: Progress tracking with hearts and XP.
- **Dynamic Exercises**: Support for Word Bank, Listening, Speaking, and Matching.
- **Content Management**: Advanced admin tools for curriculm sequence management (Reorder/Swap).
