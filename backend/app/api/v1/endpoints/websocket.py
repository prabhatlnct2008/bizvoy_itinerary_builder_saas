from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.deps import get_db
from app.models.share import ShareLink
from app.services.websocket_service import websocket_manager

router = APIRouter()


@router.websocket("/itinerary/{token}")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for live itinerary updates"""

    # Validate token
    share_link = db.query(ShareLink).filter(
        ShareLink.token == token,
        ShareLink.is_active == True,
        ShareLink.live_updates_enabled == True
    ).first()

    if not share_link:
        await websocket.close(code=4404, reason="Invalid or inactive share link")
        return

    # Check expiry
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        await websocket.close(code=4410, reason="Share link expired")
        return

    # Accept connection
    await websocket_manager.connect(token, websocket)

    try:
        # Keep connection alive and listen for messages
        while True:
            # Receive message from client (mostly for ping/pong)
            data = await websocket.receive_text()

            # Handle ping
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        websocket_manager.disconnect(token, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        websocket_manager.disconnect(token, websocket)
