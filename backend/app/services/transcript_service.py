import logging
from typing import Optional

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    YouTubeTranscriptApi = None

logger = logging.getLogger(__name__)


class TranscriptService:
    """Service to fetch and process YouTube transcripts for AI context."""

    @staticmethod
    def get_cumulative_transcript(video_id: str, time_in_seconds: int, max_words: int = 1000) -> Optional[str]:
        """
        Fetches the transcript up to the given timestamp and returns the last `max_words`.
        Supports both v0.x and v1.x of youtube-transcript-api.
        """
        if not video_id or video_id == "unknown":
            return None

        if YouTubeTranscriptApi is not None:
            try:
                languages = ['en', 'hi', 'hi-IN', 'es', 'fr', 'de']
                if hasattr(YouTubeTranscriptApi, 'get_transcript'):
                    transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
                else:
                    api = YouTubeTranscriptApi()
                    transcript_list = api.fetch(video_id, languages=languages)

                # Filter chunks that start before or at the requested timestamp
                filtered_chunks = []
                for chunk in transcript_list:
                    start_time = getattr(chunk, 'start', chunk.get('start', 0) if isinstance(chunk, dict) else 0)
                    if start_time <= time_in_seconds:
                        text = getattr(chunk, 'text', chunk.get('text', '') if isinstance(chunk, dict) else '')
                        if text:
                            filtered_chunks.append(text)

                full_text = " ".join(filtered_chunks)
                words = full_text.split()
                
                # Truncate to max_words from the end (most recent context)
                final_text = " ".join(words[-max_words:])
                
                if final_text.strip():
                    return final_text
                    
            except Exception as e:
                logger.warning(f"Failed to fetch transcript for video {video_id}: {e}")

        # Fallback timestamp context if closed captions are disabled or unavailable
        minutes = int(time_in_seconds // 60)
        seconds = int(time_in_seconds % 60)
        return (
            f"--- LECTURE VIDEO [{video_id}] CURRENT TIMESTAMP: {minutes:02d}:{seconds:02d} ({time_in_seconds}s) ---\n"
            f"Student is currently viewing the lecture at timestamp {minutes:02d}:{seconds:02d}."
        )


# Singleton instance
transcript_service = TranscriptService()
