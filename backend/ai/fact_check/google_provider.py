"""
AI-Content Verification Hub — Google Fact Check Search API Provider

Queries Google Fact Check Tools API:
https://factchecktools.googleapis.com/v1alpha1/claims:search

Parses structured claimReview items from global fact-checking publishers.
"""

from typing import Any, Dict, List, Optional
import logging
import httpx

from ai.fact_check.base_provider import BaseFactCheckProvider
from config import get_settings

logger = logging.getLogger("aicvhub.factcheck.google")


class GoogleFactCheckProvider(BaseFactCheckProvider):
    """Production provider querying Google Fact Check Tools API."""

    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.google_fact_check_api_key
        self.api_url = settings.google_fact_check_api_url
        self.timeout = settings.fact_check_timeout_seconds

    @property
    def provider_name(self) -> str:
        return "google-fact-check"

    @property
    def is_demo(self) -> bool:
        return False

    async def search_claim(self, claim_text: str) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "provider": self.provider_name,
                "is_demo": False,
                "query_claim": claim_text,
                "sources": [],
                "status": "error",
                "error_message": "Google Fact Check API key is unconfigured.",
            }

        params = {
            "query": claim_text,
            "key": self.api_key,
            "languageCode": "en",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.api_url, params=params)

                if response.status_code != 200:
                    logger.error(f"Google Fact Check API HTTP {response.status_code}: {response.text}")
                    return {
                        "provider": self.provider_name,
                        "is_demo": False,
                        "query_claim": claim_text,
                        "sources": [],
                        "status": "error",
                        "error_message": f"External API returned HTTP {response.status_code}.",
                    }

                data = response.json()
                claims = data.get("claims", [])

                if not claims:
                    return {
                        "provider": self.provider_name,
                        "is_demo": False,
                        "query_claim": claim_text,
                        "sources": [],
                        "status": "unverified",
                        "error_message": None,
                    }

                sources: List[Dict[str, Any]] = []

                for item in claims:
                    claim_text_item = item.get("text", claim_text)
                    reviews = item.get("claimReview", [])

                    for rev in reviews:
                        publisher_info = rev.get("publisher", {})
                        publisher_name = publisher_info.get("name", "Authoritative Fact-Check Publisher")
                        publisher_site = publisher_info.get("site", "")
                        url = rev.get("url", "")
                        title = rev.get("title", claim_text_item)
                        review_date = rev.get("reviewDate", "")
                        textual_rating = rev.get("textualRating", "Unrated")

                        sources.append({
                            "publisher": publisher_name,
                            "publisher_site": publisher_site,
                            "url": url,
                            "title": title,
                            "publication_date": review_date,
                            "textual_rating": textual_rating,
                            "claim_text": claim_text_item,
                        })

                return {
                    "provider": self.provider_name,
                    "is_demo": False,
                    "query_claim": claim_text,
                    "sources": sources,
                    "status": "success" if sources else "unverified",
                    "error_message": None,
                }

        except httpx.TimeoutException:
            logger.warning(f"Google Fact Check API request timed out ({self.timeout}s).")
            return {
                "provider": self.provider_name,
                "is_demo": False,
                "query_claim": claim_text,
                "sources": [],
                "status": "error",
                "error_message": "External fact-check search service connection timed out.",
            }
        except Exception as e:
            logger.error(f"Error querying Google Fact Check API: {e}", exc_info=True)
            return {
                "provider": self.provider_name,
                "is_demo": False,
                "query_claim": claim_text,
                "sources": [],
                "status": "error",
                "error_message": f"External fact-checking service failure: {str(e)}",
            }
