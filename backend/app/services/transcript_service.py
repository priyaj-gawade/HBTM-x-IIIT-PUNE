import logging
from typing import Optional
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

logger = logging.getLogger(__name__)

class TranscriptService:
    """Service to fetch and process YouTube transcripts for AI context."""

    @staticmethod
    def get_cumulative_transcript(video_id: str, time_in_seconds: int, max_words: int = 1000) -> Optional[str]:
        """
        Fetches the transcript up to the given timestamp and returns the last `max_words`.
        Includes fallback mock logic for the demo video 'pnWINBJ3-yA'.
        """
        if not video_id or video_id == "unknown":
            return None

        try:
            # Fetch transcript (tries multiple languages)
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, languages=['en', 'hi', 'hi-IN', 'es', 'fr', 'de']
            )

            # Filter chunks that start before or at the requested timestamp
            filtered_chunks = [
                chunk["text"] for chunk in transcript_list 
                if chunk["start"] <= time_in_seconds
            ]

            full_text = " ".join(filtered_chunks)
            words = full_text.split()
            
            # Truncate to max_words from the end (most recent context)
            final_text = " ".join(words[-max_words:])
            
            if final_text.strip():
                return final_text
                
        except Exception as e:
            logger.warning(f"Failed to fetch transcript for video {video_id}: {e}")

        # Fallback Mock Logic (Ported from Oreo)
        if video_id == "pnWINBJ3-yA":
            sb = []
            sb.append(f"--- CUMULATIVE VIDEO TRANSCRIPT & CODE (0s to {time_in_seconds}s) ---")
            sb.append("[00:05] Instructor: Welcome! Today we are learning Python Object-Oriented Programming (OOP).")
            sb.append("[00:30] Instructor: A class is our blueprint for creating custom objects.")
            
            if time_in_seconds >= 60:
                sb.append("[01:05] Instructor: Let's write our first class code:")
                sb.append("        class Cookie:")
                sb.append("            # Blueprint for creating cookie objects")
            if time_in_seconds >= 120:
                sb.append("[02:10] Instructor: Now let's add the __init__ constructor to set up properties:")
                sb.append("        class Cookie:")
                sb.append("            def __init__(self, flavor, weight):")
                sb.append("                self.flavor = flavor")
                sb.append("                self.weight = weight")
            if time_in_seconds >= 210:
                sb.append("[03:30] Instructor: Now let's instantiate objects and add an instance method:")
                sb.append("            def eat(self):")
                sb.append("                return f'Eating a delicious {self.flavor} cookie!'")
                sb.append("        # Instantiating objects in memory:")
                sb.append("        my_cookie = Cookie('Chocolate Chip', 50)")
            if time_in_seconds >= 320:
                sb.append("[05:20] Instructor: Now let's demonstrate class inheritance:")
                sb.append("        class SpecialCookie(Cookie):")
                sb.append("            def __init__(self, flavor, weight, topping):")
                sb.append("                super().__init__(flavor, weight)")
                sb.append("                self.topping = topping")
                
            return "\n".join(sb)

        # Generic fallback
        minutes = int(time_in_seconds // 60)
        seconds = int(time_in_seconds % 60)
        return (
            f"--- CUMULATIVE TRANSCRIPT FOR LECTURE VIDEO [{video_id}] UP TO {time_in_seconds} SECONDS ---\n"
            f"[{minutes:02d}:{seconds:02d}] Lecture topic explanation, core theoretical principles, key terminology, "
            f"and step-by-step concepts presented up to timestamp {time_in_seconds}s."
        )

# Singleton instance
transcript_service = TranscriptService()
