"""
AI-Content Verification Hub — Demo / Fallback Fact Check Provider

Explicitly marked with is_demo: True for development or unconfigured API state.
"""

from typing import Any, Dict, List
from ai.fact_check.base_provider import BaseFactCheckProvider

DEBUNKED_DEMO_RECORDS = [
    {
        "keywords": ["covid", "vaccine", "dna"],
        "claim": "COVID-19 vaccines alter human DNA",
        "publisher": "CDC Fact Check & WHO Advisory",
        "url": "https://www.cdc.gov/coronavirus/2019-ncov/vaccines/facts.html",
        "title": "Myths and Facts About COVID-19 Vaccines",
        "publication_date": "2024-01-15",
        "textual_rating": "False",
    },
    {
        "keywords": ["federal reserve", "bankruptcy", "bankrupt"],
        "claim": "Federal Reserve declared bankruptcy",
        "publisher": "US Treasury & Reuters Fact Check",
        "url": "https://www.reuters.com/fact-check",
        "title": "Fact Check: Federal Reserve Board has not declared bankruptcy",
        "publication_date": "2024-02-10",
        "textual_rating": "False",
    },
    {
        "keywords": ["5g", "coronavirus", "towers", "radiation"],
        "claim": "5G towers spread coronavirus",
        "publisher": "ICNIRP & IEEE Standards Association",
        "url": "https://www.who.int/news-room/q-a-detail/5g-mobile-networks-and-health",
        "title": "5G Mobile Networks and Health",
        "publication_date": "2023-11-20",
        "textual_rating": "False",
    },
]


class DemoFactCheckProvider(BaseFactCheckProvider):
    """Fallback provider returning simulated demo evidence."""

    @property
    def provider_name(self) -> str:
        return "demo-fact-checker"

    @property
    def is_demo(self) -> bool:
        return True

    async def search_claim(self, claim_text: str) -> Dict[str, Any]:
        text_lower = claim_text.lower()
        matched_sources: List[Dict[str, Any]] = []

        for rec in DEBUNKED_DEMO_RECORDS:
            if any(kw in text_lower for kw in rec["keywords"]):
                matched_sources.append({
                    "publisher": rec["publisher"],
                    "publisher_site": "cdc.gov / reuters.com",
                    "url": rec["url"],
                    "title": rec["title"],
                    "publication_date": rec["publication_date"],
                    "textual_rating": rec["textual_rating"],
                    "claim_text": rec["claim"],
                })

        return {
            "provider": self.provider_name,
            "is_demo": True,
            "query_claim": claim_text,
            "sources": matched_sources,
            "status": "success" if matched_sources else "unverified",
            "error_message": None,
        }
