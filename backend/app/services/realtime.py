from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


@dataclass
class PresenceState:
    user_id: UUID
    online: bool = False
    watching_media_id: str | None = None
    watching_title: str | None = None
    last_seen_at: datetime | None = None


class RealtimeManager:
    """Small in-memory WebSocket presence manager.

    This is intentionally lightweight for the current single-node k3s app. If the
    backend is scaled to multiple pods later, move this state/broadcast layer to
    Redis pub/sub or a managed realtime service so every pod sees the same users.
    """

    def __init__(self) -> None:
        self._connections: dict[UUID, list[WebSocket]] = {}
        self._presence: dict[UUID, PresenceState] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)
        state = self._presence.setdefault(user_id, PresenceState(user_id=user_id))
        state.online = True
        state.last_seen_at = datetime.now(timezone.utc)
        await self.broadcast_presence_change(user_id)

    async def disconnect(self, websocket: WebSocket, user_id: UUID) -> None:
        sockets = self._connections.get(user_id, [])
        self._connections[user_id] = [socket for socket in sockets if socket is not websocket]

        if not self._connections[user_id]:
            self._connections.pop(user_id, None)
            state = self._presence.setdefault(user_id, PresenceState(user_id=user_id))
            state.online = False
            state.watching_media_id = None
            state.watching_title = None
            state.last_seen_at = datetime.now(timezone.utc)
            await self.broadcast_presence_change(user_id)

    def get_status(self, user_id: UUID) -> PresenceState:
        state = self._presence.get(user_id)
        if state:
            # Online truth comes from active sockets, not stale state.
            state.online = bool(self._connections.get(user_id))
            return state
        return PresenceState(user_id=user_id, online=False)

    def presence_payload_for(self, user_id: UUID) -> dict[str, Any]:
        state = self.get_status(user_id)
        return {
            "id": str(user_id),
            "online": state.online,
            "watching_media_id": state.watching_media_id,
            "watching_title": state.watching_title,
            "last_seen_at": state.last_seen_at.isoformat() if state.last_seen_at else None,
        }

    async def update_watching(
        self,
        user_id: UUID,
        media_id: str | None,
        title: str | None,
    ) -> None:
        state = self._presence.setdefault(user_id, PresenceState(user_id=user_id))
        state.online = bool(self._connections.get(user_id))
        state.watching_media_id = media_id
        state.watching_title = title
        state.last_seen_at = datetime.now(timezone.utc)
        await self.broadcast_presence_change(user_id)

    async def broadcast_presence_change(self, user_id: UUID) -> None:
        await self.broadcast(
            {
                "type": "presence_changed",
                "user": self.presence_payload_for(user_id),
            }
        )

    async def send_to_user(self, user_id: UUID, payload: dict[str, Any]) -> None:
        sockets = list(self._connections.get(user_id, []))
        stale: list[WebSocket] = []
        encoded = jsonable_encoder(payload)
        for websocket in sockets:
            try:
                await websocket.send_json(encoded)
            except Exception:
                stale.append(websocket)

        if stale:
            self._connections[user_id] = [socket for socket in self._connections.get(user_id, []) if socket not in stale]
            if not self._connections.get(user_id):
                self._connections.pop(user_id, None)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        # Iterate over a copy so removals do not mutate while looping.
        for user_id in list(self._connections.keys()):
            await self.send_to_user(user_id, payload)


realtime_manager = RealtimeManager()
