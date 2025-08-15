# Remotion Video Clip MVP

A minimal MVP for rendering video clips with captions using Remotion.

## Architecture

- **Backend**: Express server with Remotion for rendering videos
- **Frontend**: Vite + React app with preview capabilities
- **Shared**: Clip component duplicated in both backend and frontend for consistency

## Prerequisites

- Node.js 18+ and npm installed
- Git (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:Jthai006/remotion-spike.git
cd remotion-spike
```

### 2. Install Dependencies

```bash
# Run the install script (recommended)
./install.sh
```

Or install manually:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
cd ..
```

### 3. Start the Application

```bash
# Start both servers with one command
./start.sh
```

Or start them separately in different terminals:

```bash
# Terminal 1 - Backend (port 4000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:4000

### 5. Using the Application

1. The app comes pre-configured with a sample video (Big Buck Bunny)
2. Adjust the video settings:
   - **Video URL**: Enter any public MP4 URL or use the default
   - **Start (ms)**: Set the start time in milliseconds
   - **Duration (ms)**: Set the clip duration in milliseconds
3. Preview your clip in real-time using the player
4. Click "Render on Backend" to generate the MP4
5. Wait for the status to show "completed"
6. Click the download link to get your rendered video

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

## Troubleshooting

### Common Issues

1. **Port already in use**: If ports 4000 or 5173 are already in use, you can modify them in:
   - Backend: `backend/src/server.ts` (change PORT variable)
   - Frontend: `frontend/vite.config.ts` (add server.port option)

2. **Video won't load**: Ensure the video URL is accessible and CORS-enabled. The default Big Buck Bunny video should always work.

3. **Render fails**: Check the backend console for error messages. Common issues:
   - Invalid video URL
   - Unsupported video format
   - Missing ffmpeg (Remotion will auto-install if needed)

4. **Installation fails**: Ensure you have Node.js 18+ installed:
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

## Scripts

- `./install.sh` - Install all dependencies for both frontend and backend
- `./start.sh` - Start both servers concurrently
- `npm run dev` - Start development server (run in backend or frontend directory)

## Next Steps

- Add database for persistent job storage
- Implement authentication
- Add YouTube video ingestion
- Create job queue for better performance
- Deploy to production environment
- Add more video effects and transitions
- Support for multiple caption tracks