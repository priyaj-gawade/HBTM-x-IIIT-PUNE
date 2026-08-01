import os
import logging
from typing import Any, List, Optional
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from app.utils.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest",
]

class RotationalLLMManager:
    """Manages rotational API keys and models for Google Gemini."""

    def __init__(self):
        self._load_keys()

    def _load_keys(self):
        raw_keys = [
            settings.GEMINI_KEY_1,
            settings.GEMINI_KEY_2,
            settings.GEMINI_KEY_3,
            settings.GEMINI_API_KEY,
            os.getenv("GEMINI_KEY_1", ""),
            os.getenv("GEMINI_KEY_2", ""),
            os.getenv("GEMINI_KEY_3", ""),
            os.getenv("GEMINI_API_KEY", ""),
        ]
        seen = set()
        self.keys: List[str] = []
        for k in raw_keys:
            if k and k.strip() and k.strip() not in seen:
                clean_k = k.strip()
                seen.add(clean_k)
                self.keys.append(clean_k)

        self.current_idx = 0
        if not self.keys:
            logger.warning("No Gemini API keys found in configuration or environment!")
        else:
            logger.info(f"Loaded {len(self.keys)} Gemini API keys for rotation.")

    async def generate_content_async(
        self,
        prompt: Any,
        model_name: str = "gemini-3.1-flash-lite",
        system_instruction: Optional[str] = None,
        generation_config: Optional[GenerationConfig] = None,
        request_options: Optional[dict] = None
    ) -> Any:
        """
        Attempts to generate content with the current key and model.
        Rotates keys and fallbacks to other supported models on quota/model errors.
        """
        if not self.keys:
            self._load_keys()

        if not self.keys:
            raise RuntimeError("No Gemini API keys configured.")

        # Candidate models to try in order
        candidate_models = [model_name] + [m for m in SUPPORTED_MODELS if m != model_name]
        last_exception = None

        for target_model in candidate_models:
            for _ in range(len(self.keys)):
                current_key = self.keys[self.current_idx]
                genai.configure(api_key=current_key)

                model = genai.GenerativeModel(
                    model_name=target_model,
                    system_instruction=system_instruction,
                    generation_config=generation_config
                )

                try:
                    kwargs = {}
                    if request_options:
                        kwargs["request_options"] = request_options

                    response = await model.generate_content_async(prompt, **kwargs)
                    return response

                except Exception as e:
                    error_msg = str(e).lower()
                    last_exception = e

                    # Check for 404 (model not supported/found) -> break inner loop to try next candidate model
                    if "404" in error_msg or "not found" in error_msg:
                        logger.warning(f"Model {target_model} not supported on API version, trying next model.")
                        break

                    # Check for rate-limit, auth or invalid key -> rotate to next key
                    if any(code in error_msg for code in ["429", "401", "403", "400", "quota", "exhausted"]):
                        logger.warning(f"Key at index {self.current_idx} failed with {type(e).__name__}. Rotating key...")
                        self.current_idx = (self.current_idx + 1) % len(self.keys)
                        continue
                    else:
                        raise e

        logger.error(f"All available Gemini keys and models failed. Last error: {last_exception}")
        raise last_exception or Exception("All Gemini API keys failed to generate content.")

llm_manager = RotationalLLMManager()
