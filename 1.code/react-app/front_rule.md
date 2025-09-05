# front_rule.md

해당 파일은 ../1.code/PROJECT.md 에 정의된 서비스를 만들기 위한 프론트엔드 코드의 rule을 정의한 파일입니다.

## Development Commands

- `npm run dev` - Start development server with Vite and hot module replacement
- `npm run build` - Build for production (runs TypeScript compilation followed by Vite build)
- `npm run lint` - Run ESLint to check code quality and style
- `npm run preview` - Preview the production build locally

## Architecture

This is a React application built with modern tooling:

**Core Stack:**

- React 19 with TypeScript
- Vite as build tool and dev server
- TailwindCSS for styling

## Styling Rules

**MUST USE TAILWIND CSS:**

- 모든 스타일링은 Tailwind CSS 클래스를 사용해야 합니다
- 커스텀 CSS 파일 작성 금지 (App.css, index.css 등)
- 인라인 스타일 사용 금지
- CSS-in-JS 라이브러리 사용 금지
- Tailwind의 유틸리티 클래스만 사용하여 모든 디자인 구현

**State Management:**

- Zustand for client-side state management (`src/store.ts`)
- TanStack Query (React Query) for server state and data fetching

**Application Structure:**

- Entry point: `src/main.tsx` sets up React app with QueryClient provider
- Main component: `src/App.tsx` demonstrates counter state and data fetching
- Global state: `src/store.ts` contains Zustand stores (currently has counter example)

**Development Setup:**

- ESLint configured with TypeScript, React Hooks, and React Refresh rules
- TypeScript with project references (app and node configs)
- Vite with React plugin for fast development and HMR
