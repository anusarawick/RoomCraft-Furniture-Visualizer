# RoomCraft Furniture Visualizer

RoomCraft is a web-based room design system for furniture consultations. It supports accurate 2D planning, interactive 3D visualization, reusable saved designs, and a full backend for account/profile/design persistence.

## Core Features
- Designer registration, login, and JWT-backed session workflow.
- Create room specification (size, height, wall/floor colors).
- 2D layout editor (drag, rotate, resize, shading).
- Multi-room plan view.
- 3D viewport with orbit + inside controls.
- Color and shading controls (room + item + global).
- Save, edit, delete, and reopen designs through MongoDB.
- Profile editing with persisted user information.
- Undo/redo history support.
- Accessibility toggles (high contrast, larger text, reduced motion).

## Innovation Features Added
- Snap-to-grid alignment (0.1m) for move/resize.
- Split 2D + 3D view mode.
- Export 2D plan to PNG for consultation/report evidence.
- Selected item live measurement readout.

## Technology
- React 19
- Vite
- Three.js
- Node.js + Express
- MongoDB + Mongoose
- Docker / Docker Compose
- Browser local storage for non-account UI preferences only

## Run Frontend Locally
1. `npm install`
2. `npm run dev`
3. `npm run lint`
4. `npm run build`

## Run Backend With Docker
1. Copy `.env.example` to `.env` if you want to override `VITE_API_URL`.
2. Copy `backend/.env.example` to `backend/.env` if you want to run the API outside Docker.
3. Start MongoDB and the Express API with `npm run docker:up`.
4. The API will be available at `http://localhost:4000/api`.
5. Run the frontend with `npm run dev`.

## API Coverage
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/designs`
- `POST /api/designs`
- `GET /api/designs/:designId`
- `PUT /api/designs/:designId`
- `DELETE /api/designs/:designId`
