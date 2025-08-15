# Remotion Video Clip MVP

A minimal MVP for rendering video clips with captions using Remotion.

## Architecture

- **Backend**: Express server with Remotion for rendering videos
- **Frontend**: Vite + React app with preview capabilities
- **Shared**: Clip component duplicated in both backend and frontend for consistency

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Add a Sample Video

Place an MP4 video file in `backend/public/` named `sample-source.mp4`

### 3. Start Both Servers

```bash
# From the root directory
./start.sh
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Features

- **Video Preview**: Real-time preview using Remotion Player
- **Video Rendering**: Server-side rendering to MP4
- **Captions**: Overlay captions with timing control
- **Customizable**: Adjust start time, duration, resolution, and FPS

## API Endpoints

- `POST /api/render` - Start a new render job
- `GET /api/clips/:id` - Check render status
- `GET /media/:filename` - Download rendered videos

## Project Structure

```
mvp-remotion/
├── backend/
│   ├── src/
│   │   ├── server.ts        # Express API
│   │   ├── render.ts        # Remotion render logic
│   │   └── remotion/
│   │       ├── Clip.tsx     # Video composition
│   │       └── RemotionRoot.tsx
│   └── out/                 # Rendered videos
└── frontend/
    └── src/
        ├── App.tsx          # Main UI
        └── Clip.tsx         # Preview component
```

## Next Steps

- Add database for persistent job storage
- Implement authentication
- Add YouTube video ingestion
- Create job queue for better performance
- Deploy to production environment