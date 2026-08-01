import logging
from typing import Any, List, Optional
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from app.utils.config import settings

logger = logging.getLogger(__name__)

class RotationalLLMManager:
    """Manages rotational API keys for Google Gemini."""

    def __init__(self):
        # Read keys from settings, filter out empty ones
        raw_keys = [settings.GEMINI_KEY_1, settings.GEMINI_KEY_2, settings.GEMINI_KEY_3]
        self.keys = [k for k in raw_keys if k and k.strip()]
        self.current_idx = 0
        if not self.keys:
            logger.warning("No Gemini API keys found in configuration!")

    async def generate_content_async(
        self,
        prompt: Any,
        model_name: str = "gemini-3.1-flash-lite",
        system_instruction: Optional[str] = None,
        generation_config: Optional[GenerationConfig] = None,
        request_options: Optional[dict] = None
    ) -> Any:
        """
        Attempts to generate content with the current key.
        If it encounters a quota (429) or auth error, rotates to the next key and retries.
        """
        if not self.keys:
            raise RuntimeError("No Gemini API keys configured.")

        last_exception = None

        # Try each key once
        for _ in range(len(self.keys)):
            current_key = self.keys[self.current_idx]
            
            # Configure global state (not thread-safe, but okay for this context)
            genai.configure(api_key=current_key)
            
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
                generation_config=generation_config
            )
            
            try:
                # kwargs might be empty or missing depending on sdk versions
                kwargs = {}
                if request_options:
                    kwargs["request_options"] = request_options
                    
                response = await model.generate_content_async(prompt, **kwargs)
                return response
                
            except Exception as e:
                error_msg = str(e).lower()
                # 429 Resource Exhausted, 403 Forbidden, 401 Unauthorized, 400 Bad Request (API key invalid)
                if any(code in error_msg for code in ["429", "401", "403", "400", "quota", "exhausted"]):
                    logger.warning(f"Key at index {self.current_idx} failed with error: {e}. Rotating...")
                    self.current_idx = (self.current_idx + 1) % len(self.keys)
                    last_exception = e
                    continue
                else:
                    # Other exceptions (like schema errors) should be raised immediately
                    raise e
                    
        logger.error("All available Gemini API keys failed.")
        raise last_exception or Exception("All Gemini API keys failed to generate content.")

llm_manager = RotationalLLMManager()
