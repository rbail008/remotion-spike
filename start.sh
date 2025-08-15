#!/bin/bash

echo "Starting Remotion MVP..."
echo ""
echo "Starting backend server on http://localhost:4000..."
cd backend && npm run dev &
BACKEND_PID=$!

echo ""
echo "Starting frontend server on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait