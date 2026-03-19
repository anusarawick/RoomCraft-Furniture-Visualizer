# RoomCraft Furniture Visualizer

RoomCraft is a web-based room planning and furniture visualization system built for furniture consultations. It combines 2D layout editing, interactive 3D visualization, account-backed design persistence, and an admin-controlled template marketplace.

## Features

### Customer Features
- Register and sign in with a backend-backed account.
- Create single-room and multi-room designs with dimensions, colors, and room shape selection.
- Edit layouts in 2D and 3D with drag, rotate, resize, undo/redo, and collision handling.
- Save, reopen, update, and delete personal designs through MongoDB.
- Export designs and use accessibility settings such as high contrast, larger text, and reduced motion.
- Browse published templates from the sidebar.
- Preview templates in 2D before buying.
- Purchase templates through the frontend payment section.
- Access purchased templates later from the customer collection and unlock 3D viewing there.

### Admin Features
- Sign in from the same login page with the default admin account.
- Access a dedicated admin dashboard.
- View registered users.
- Create, edit, save, price, and delete design templates.
- Publish templates for customer preview and purchase.

## Default Admin Login
- Username: `admin`
- Password: `admin12345`

Optional admin environment variables can be supplied through the backend environment if you want to override the defaults in deployment.

## Technology Stack
- React 19
- Vite
- Three.js
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Docker / Docker Compose
- Browser storage for client-side UI/session preferences where applicable

## Project Structure
- `src/` frontend application
- `src/admin/` admin dashboard, users, and template management screens
- `src/customer/` template marketplace, purchase modal, and collection screens
- `backend/src/` Express API, MongoDB models, auth, users, designs, templates, and purchase logic

## Frontend Setup
1. Install frontend dependencies:
   `npm install`
2. Start the Vite app:
   `npm run dev`
3. Build for production:
   `npm run build`
4. Run the frontend test suite:
   `npm test`

## Backend Setup

### Run Locally
1. Install backend dependencies:
   `npm --prefix backend install`
2. Copy `backend/.env.example` to `backend/.env`
3. Set at least:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_ORIGIN`
4. Start the API:
   `npm run api:dev`

### Run With Docker
1. Copy `.env.example` to `.env` if needed
2. Copy `backend/.env.example` to `backend/.env` if needed
3. Start MongoDB and the API:
   `npm run docker:up`
4. Stop services:
   `npm run docker:down`

The API runs at `http://localhost:4000/api` by default.

## Environment Files

### Frontend `.env`
- `VITE_API_URL=http://localhost:4000/api`

### Backend `backend/.env`
- `PORT=4000`
- `MONGODB_URI=mongodb://localhost:27017/roomcraft`
- `JWT_SECRET=replace-this-with-a-long-random-secret`
- `CLIENT_ORIGIN=http://localhost:5173`

## API Coverage

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users` admin only

### Customer Designs
- `GET /api/designs`
- `POST /api/designs`
- `GET /api/designs/:designId`
- `PUT /api/designs/:designId`
- `DELETE /api/designs/:designId`

### Templates
- `GET /api/designs/templates`
- `POST /api/designs/templates` admin only
- `PUT /api/designs/templates/:designId` admin only
- `DELETE /api/designs/templates/:designId` admin only

### Purchases and Collection
- `POST /api/designs/templates/:designId/purchase`
- `GET /api/designs/collection`

## Notes
- Template payment is currently a frontend-only purchase flow intended for coursework/demo use, not a real payment gateway.
- The app now supports two role-based experiences: customer and admin.
- Templates are shared content, while regular designs remain customer-owned.
