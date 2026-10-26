import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx

from config import get_settings
from database.db import get_db
from database import models

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    user_id: str | None = None

settings = get_settings()

@router.post("/message", response_model=dict)
async def chat_message(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Store user message
    chat_msg_user = models.ChatMessage(
        user_id=request.user_id,
        role="user",
        content=request.message,
    )
    db.add(chat_msg_user)
    await db.flush()  # get ID

    # Call OpenAI API
    openai_key = settings.openai_api_key
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    headers = {
        "Authorization": f"Bearer {openai_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant for the AI Content Verification Hub application."},
            {"role": "user", "content": request.message},
        ],
        "stream": True,
    }
    async def openai_stream():
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", "https://api.openai.com/v1/chat/completions", headers=headers, json=payload) as response:
                async for chunk in response.aiter_text():
                    if not chunk:
                        continue
                    for line in chunk.splitlines():
                        if line.startswith("data: "):
                            data = line[6:].strip()
                            if data == "[DONE]":
                                break
                            try:
                                payload_json = json.loads(data)
                                delta = payload_json.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content")
                                if content:
                                    yield content
                            except Exception:
                                continue
    return StreamingResponse(openai_stream(), media_type="text/event-stream")
