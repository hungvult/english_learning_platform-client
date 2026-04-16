# English Learning Platform - Client

This project is the frontend for the English Learning Platform, an interactive language learning application built with Next.js.

## How to run the project

To run the development server, use the following commands:

```bash
# Install the project dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

After starting the server, open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project uses the modern Next.js App Router architecture. Here is a brief overview of the main directories:

- **`app/`**: Contains the routes and main pages for the application.
  - **`(auth)/`**: Pages for authentication, including Login and Registration.
  - **`(marketing)/`**: The landing page and public-facing routes.
  - **`(main)/`**: Main application routes for authenticated users (e.g., learning paths and lessons).
  - **`api/`**: Next.js API routes if any.
- **`components/`**: Reusable UI components used throughout the application.
- **`lib/`**: Utility functions, custom hooks, and shared libraries (like the `api` fetch wrapper).
- **`public/`**: Static assets such as images (`hero.svg`, `mascot.svg`, etc.) that are served directly.
- **`store/`**: Configuration for global state management.
- **`types/`**: TypeScript type definitions ensuring type-safety across the application.
- **`config/`**: Global configuration and constants.
