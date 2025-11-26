from typing import Dict, List
from fastapi import WebSocket
import json


class ConnectionManager:
    """Manage WebSocket connections for live itinerary updates"""

    def __init__(self):
        # Store active connections: {itinerary_token: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, token: str, websocket: WebSocket):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        if token not in self.active_connections:
            self.active_connections[token] = []
        self.active_connections[token].append(websocket)
        print(f"Client connected to itinerary {token}. Total connections: {len(self.active_connections[token])}")

    def disconnect(self, token: str, websocket: WebSocket):
        """Remove WebSocket connection"""
        if token in self.active_connections:
            if websocket in self.active_connections[token]:
                self.active_connections[token].remove(websocket)
            # Clean up empty lists
            if not self.active_connections[token]:
                del self.active_connections[token]
        print(f"Client disconnected from itinerary {token}")

    async def broadcast(self, token: str, message: dict):
        """Broadcast message to all clients connected to an itinerary"""
        if token not in self.active_connections:
            return

        # Convert message to JSON
        message_json = json.dumps(message)

        # Send to all connected clients
        disconnected = []
        for connection in self.active_connections[token]:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                print(f"Error sending message: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(token, connection)

    def get_connection_count(self, token: str) -> int:
        """Get number of active connections for an itinerary"""
        return len(self.active_connections.get(token, []))


# Singleton instance
websocket_manager = ConnectionManager()
