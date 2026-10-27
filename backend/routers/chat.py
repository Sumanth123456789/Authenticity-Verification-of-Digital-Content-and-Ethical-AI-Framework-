import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
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

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are an expert AI assistant for the AI Content Verification Hub — "
    "a platform that detects deepfakes, voice clones, AI-generated media, "
    "phishing, and manipulated content. Help users understand their verification "
    "results, explain AI detection concepts, and guide them through the platform. "
    "Be concise, accurate, and professional."
)

@router.post("/message")
async def chat_message(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Stream a chat response from GROQ (llama3-8b-8192)."""

    groq_key = settings.groq_api_key
    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ API key not configured. Set GROQ_API_KEY env var.")

    # Persist user message
    chat_msg_user = models.ChatMessage(
        user_id=request.user_id,
        role="user",
        content=request.message,
    )
    db.add(chat_msg_user)
    await db.flush()

    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": request.message},
        ],
        "stream": True,
        "max_tokens": 1024,
        "temperature": 0.7,
    }

    async def groq_stream():
        full_response = ""
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", GROQ_API_URL, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    yield f"Error from GROQ API: {response.status_code} — {error_body.decode()}"
                    return

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
                                    full_response += content
                                    yield content
                            except Exception:
                                continue

        # Persist assistant message after stream completes
        if full_response:
            try:
                from database.db import AsyncSessionLocal
                async with AsyncSessionLocal() as persist_db:
                    assistant_msg = models.ChatMessage(
                        user_id=request.user_id,
                        role="assistant",
                        content=full_response,
                    )
                    persist_db.add(assistant_msg)
                    await persist_db.commit()
            except Exception:
                pass  # Non-critical — don't fail the stream

    return StreamingResponse(groq_stream(), media_type="text/plain")
