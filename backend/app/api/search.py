"""Search API routes for learning resources and educational videos."""

import asyncio
import html
import json
import logging
import os
import re
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query
from app.utils.config import get_settings

router = APIRouter(prefix="/api/search", tags=["Search"])
logger = logging.getLogger(__name__)
settings = get_settings()

DEFAULT_YOUTUBE_API_KEY = "AIzaSyBPZN7oGJMF8dUVK6VorXIFGrsMLJr-n6k"


def _scrape_youtube_search(query: str) -> List[Dict[str, Any]]:
    """Scrape live YouTube search results dynamically as a secondary fallback."""
    try:
        clean_query = re.sub(r"[^\w\s-]", "", query).strip()
        if not clean_query:
            return []
        encoded_query = urllib.parse.quote_plus(f"{clean_query} tutorial educational")
        url = f"https://www.youtube.com/results?search_query={encoded_query}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            html_text = response.read().decode("utf-8", errors="ignore")

        # Extract video IDs from videoRenderer objects
        video_ids = list(dict.fromkeys(re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html_text)))
        
        results = []
        for vid in video_ids[:3]:
            # Extract video title if possible
            title_match = re.search(rf'"videoId":"{vid}".*?"title":\{{"runs":\[\{{"text":"([^"]+)"', html_text)
            title = html.unescape(title_match.group(1)) if title_match else f"{clean_query.title()} Tutorial"
            
            # Extract channel name if available
            channel_match = re.search(rf'"videoId":"{vid}".*?"ownerText":\{{"runs":\[\{{"text":"([^"]+)"', html_text)
            channel = html.unescape(channel_match.group(1)) if channel_match else "YouTube"

            results.append({
                "id": vid,
                "title": title,
                "thumbnailUrl": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                "videoUrl": f"https://www.youtube.com/watch?v={vid}",
                "author": channel,
                "duration": "10:00",
                "type": "video",
            })
        return results
    except Exception as e:
        logger.warning(f"YouTube public search scrape fallback failed: {e}")
        return []


@router.get("/videos")
async def search_videos(
    topic: str = Query(..., description="Topic or activity to search videos for"),
    context: Optional[str] = Query("", description="Optional broader context or subject"),
    workspaceId: Optional[str] = Query("", description="Optional workspace ID"),
):
    """
    Search educational YouTube videos using the YouTube Data API v3.
    Searches subtopics as titles with specific duration (medium) and type (video), exactly like Oreo.
    """
    query = f"{topic} {context}".strip()
    youtube_api_key = (
        settings.YOUTUBE_API_KEY 
        or os.getenv("YOUTUBE_API_KEY") 
        or DEFAULT_YOUTUBE_API_KEY
    )

    # 1. Primary: YouTube Data API v3 (Oreo Search Pattern)
    if youtube_api_key and youtube_api_key not in ("NONE", "mock-key", ""):
        try:
            encoded_query = urllib.parse.quote(query)
            api_url = (
                f"https://www.googleapis.com/youtube/v3/search?"
                f"part=snippet&maxResults=3&q={encoded_query}&type=video&videoDuration=medium&key={youtube_api_key}"
            )
            req = urllib.request.Request(api_url)
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("items", [])
                if items:
                    results = []
                    for item in items:
                        vid = item.get("id", {}).get("videoId")
                        snippet = item.get("snippet", {})
                        if vid:
                            raw_title = snippet.get("title") or topic
                            title = html.unescape(raw_title)
                            channel_title = html.unescape(snippet.get("channelTitle") or "YouTube")
                            thumbnails = snippet.get("thumbnails", {})
                            thumb_url = (
                                thumbnails.get("high", {}).get("url")
                                or thumbnails.get("default", {}).get("url")
                                or f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
                            )
                            results.append({
                                "id": vid,
                                "title": title,
                                "thumbnailUrl": thumb_url,
                                "videoUrl": f"https://www.youtube.com/watch?v={vid}",
                                "author": channel_title,
                                "duration": "10:00",
                                "type": "video",
                            })
                    if results:
                        return results
        except Exception as e:
            logger.warning(f"YouTube Data API search failed, attempting fallback: {e}")

    # 2. Secondary Fallback: Dynamic live scraper
    try:
        scraped_results = await asyncio.to_thread(_scrape_youtube_search, query)
        if scraped_results:
            return scraped_results
    except Exception as e:
        logger.warning(f"Async scrape fallback failed: {e}")

    # 3. Clean empty fallback if nothing found
    return []
