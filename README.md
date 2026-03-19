# RoomCraft Furniture Visualizer

RoomCraft is an HCI coursework project for planning and visualizing furnished rooms in both 2D and 3D. The application combines a React frontend, an Express API, and MongoDB so users can design spaces, save their work, and explore furniture templates.

## What This Project Does

- Create room layouts with custom dimensions and room shapes.
- Edit spaces in 2D and preview them in 3D.
- Save, reopen, update, and delete designs with account-based persistence.
- Browse and purchase published templates in the customer flow.
- Manage users and templates through an admin dashboard.

## Repository Structure

The runnable application lives in the [`furniture-visualizer`](c:\Users\NGC\OneDrive\Desktop\HCI\RoomCraft-Furniture-Visualizer\furniture-visualizer) folder.

- [`furniture-visualizer/src`](c:\Users\NGC\OneDrive\Desktop\HCI\RoomCraft-Furniture-Visualizer\furniture-visualizer\src): React frontend
- [`furniture-visualizer/backend/src`](c:\Users\NGC\OneDrive\Desktop\HCI\RoomCraft-Furniture-Visualizer\furniture-visualizer\backend\src): Express backend API
- [`furniture-visualizer/docker-compose.yml`](c:\Users\NGC\OneDrive\Desktop\HCI\RoomCraft-Furniture-Visualizer\furniture-visualizer\docker-compose.yml): Docker-based local setup

## Tech Stack

- React + Vite
- Three.js
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Docker Compose

## How To Run

### Prerequisites

- Node.js
- npm
- MongoDB running locally, or Docker Desktop if you want to use Docker Compose

### Run Locally

1. Move into the app folder:

```powershell
cd furniture-visualizer
```

2. Install frontend dependencies:

```powershell
npm install
```

3. Install backend dependencies:

```powershell
npm --prefix backend install
```

4. Create environment files from the examples:

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

5. Start the backend API in one terminal:

```powershell
npm run api:dev
```

6. Start the frontend in another terminal:

```powershell
npm run dev
```

### Default Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

### Run With Docker

From inside `furniture-visualizer`:

```powershell
npm run docker:up
```

To stop the containers:

```powershell
npm run docker:down
```

## Environment Variables

### Frontend `.env`

```env
VITE_API_URL=http://localhost:4000/api
```

### Backend `backend/.env`

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/roomcraft
JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

## Useful Commands

Run these from [`furniture-visualizer`](c:\Users\NGC\OneDrive\Desktop\HCI\RoomCraft-Furniture-Visualizer\furniture-visualizer):

```powershell
npm run dev
npm run api:dev
npm run build
npm test
```

## Default Admin Login

- Username: `admin`
- Password: `admin12345`

## Notes

- Template purchasing is a demo/frontend flow, not a real payment gateway.
- The more detailed application README is in [`furniture-visualizer/README.md`](c:\Users\NGC\OneDrive\Desktop\HCI\RoomCraft-Furniture-Visualizer\furniture-visualizer\README.md).
