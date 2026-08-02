import os
import logging
from typing import Any, List, Optional, Dict
from google import genai
from google.genai import types
from app.utils.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
]

class LLMResponse:
    def __init__(self, text: str):
        self.text = text

class RotationalLLMManager:
    """Manages rotational API keys and models using the official Google GenAI SDK."""

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

    def _get_client(self, api_key: str) -> genai.Client:
        return genai.Client(api_key=api_key)

    async def generate_content_async(
        self,
        prompt: Any,
        model_name: str = "gemini-3.1-flash-lite",
        system_instruction: Optional[str] = None,
        generation_config: Optional[Any] = None,
        request_options: Optional[dict] = None
    ) -> LLMResponse:
        """
        Attempts to generate content with the current key and model.
        Rotates keys and fallbacks to other supported models on quota/model errors.
        """
        if not self.keys:
            self._load_keys()

        if not self.keys:
            raise RuntimeError("No Gemini API keys configured.")

        # Build GenerateContentConfig
        mime_type = None
        temp = None
        if generation_config:
            if isinstance(generation_config, dict):
                mime_type = generation_config.get("response_mime_type")
                temp = generation_config.get("temperature")
            elif hasattr(generation_config, "response_mime_type"):
                mime_type = getattr(generation_config, "response_mime_type", None)
            elif hasattr(generation_config, "temperature"):
                temp = getattr(generation_config, "temperature", None)

        config_kwargs = {}
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if mime_type:
            config_kwargs["response_mime_type"] = mime_type
        if temp is not None:
            config_kwargs["temperature"] = temp
        if generation_config and isinstance(generation_config, dict) and "response_schema" in generation_config:
            config_kwargs["response_schema"] = generation_config["response_schema"]

        config = types.GenerateContentConfig(**config_kwargs) if config_kwargs else None

        # Candidate models to try in order
        candidate_models = [model_name] + [m for m in SUPPORTED_MODELS if m != model_name]
        last_exception = None

        for target_model in candidate_models:
            for _ in range(len(self.keys)):
                current_key = self.keys[self.current_idx]
                client = self._get_client(current_key)

                try:
                    kwargs = {}
                    if config:
                        kwargs["config"] = config

                    resp = await client.aio.models.generate_content(
                        model=target_model,
                        contents=prompt,
                        **kwargs
                    )
                    return LLMResponse(resp.text or "")

                except Exception as e:
                    error_msg = str(e).lower()
                    last_exception = e

                    # Check for 404 (model not supported/found) -> break inner loop to try next candidate model
                    if "404" in error_msg or "not found" in error_msg:
                        logger.warning(f"Model {target_model} not supported, trying next model.")
                        break

                    # Check for rate-limit, auth or invalid key -> rotate to next key
                    if any(code in error_msg for code in ["429", "401", "403", "400", "quota", "exhausted", "resourceexhausted"]):
                        logger.warning(f"Key at index {self.current_idx} failed with {type(e).__name__}. Rotating key...")
                        self.current_idx = (self.current_idx + 1) % len(self.keys)
                        continue
                    else:
                        raise e

        logger.error(f"All available Gemini keys and models failed. Last error: {last_exception}")
        raise last_exception or Exception("All Gemini API keys failed to generate content.")

    def generate_content_sync(
        self,
        prompt: Any,
        model_name: str = "gemini-3.1-flash-lite",
        system_instruction: Optional[str] = None,
        generation_config: Optional[Any] = None,
    ) -> LLMResponse:
        """Synchronous generation using Google GenAI SDK."""
        if not self.keys:
            self._load_keys()

        if not self.keys:
            raise RuntimeError("No Gemini API keys configured.")

        mime_type = None
        temp = None
        if generation_config:
            if isinstance(generation_config, dict):
                mime_type = generation_config.get("response_mime_type")
                temp = generation_config.get("temperature")
            elif hasattr(generation_config, "response_mime_type"):
                mime_type = getattr(generation_config, "response_mime_type", None)

        config_kwargs = {}
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if mime_type:
            config_kwargs["response_mime_type"] = mime_type
        if temp is not None:
            config_kwargs["temperature"] = temp
        if generation_config and isinstance(generation_config, dict) and "response_schema" in generation_config:
            config_kwargs["response_schema"] = generation_config["response_schema"]

        config = types.GenerateContentConfig(**config_kwargs) if config_kwargs else None
        candidate_models = [model_name] + [m for m in SUPPORTED_MODELS if m != model_name]
        last_exception = None

        for target_model in candidate_models:
            for _ in range(len(self.keys)):
                current_key = self.keys[self.current_idx]
                client = self._get_client(current_key)

                try:
                    kwargs = {}
                    if config:
                        kwargs["config"] = config

                    resp = client.models.generate_content(
                        model=target_model,
                        contents=prompt,
                        **kwargs
                    )
                    return LLMResponse(resp.text or "")

                except Exception as e:
                    error_msg = str(e).lower()
                    last_exception = e

                    if "404" in error_msg or "not found" in error_msg:
                        logger.warning(f"Model {target_model} not supported, trying next model.")
                        break

                    if any(code in error_msg for code in ["429", "401", "403", "400", "quota", "exhausted", "resourceexhausted"]):
                        logger.warning(f"Key at index {self.current_idx} failed with {type(e).__name__}. Rotating key...")
                        self.current_idx = (self.current_idx + 1) % len(self.keys)
                        continue
                    else:
                        raise e

        raise last_exception or Exception("All Gemini API keys failed to generate content.")

    async def embed_content_async(
        self,
        content: str,
        model_name: str = "models/gemini-embedding-001"
    ) -> List[float]:
        """Embed text content using rotational keys and official Google GenAI SDK."""
        if not self.keys:
            self._load_keys()

        if not self.keys:
            raise RuntimeError("No Gemini API keys configured.")

        last_exception = None
        for _ in range(len(self.keys)):
            current_key = self.keys[self.current_idx]
            client = self._get_client(current_key)
            try:
                resp = await client.aio.models.embed_content(
                    model=model_name,
                    contents=content
                )
                if resp.embeddings and len(resp.embeddings) > 0:
                    return resp.embeddings[0].values
                return []
            except Exception as e:
                error_msg = str(e).lower()
                last_exception = e
                if any(code in error_msg for code in ["429", "401", "403", "400", "quota", "exhausted", "resourceexhausted"]):
                    logger.warning(f"Embedding key at index {self.current_idx} failed, rotating...")
                    self.current_idx = (self.current_idx + 1) % len(self.keys)
                    continue
                else:
                    raise e

        raise last_exception or Exception("All Gemini API keys failed for embedding.")


def parse_json_guarded(text: str, schema_cls: Optional[Any] = None) -> Any:
    """
    Robust guardrail for enforcing strict JSON parsing and schema validation.
    Extracts raw JSON object/array boundaries and validates against a Pydantic model if provided.
    """
    import json
    clean = text.strip()
    
    # Strip markdown wrapper if present
    if clean.startswith("```"):
        first_nl = clean.find("\n")
        if first_nl != -1:
            clean = clean[first_nl + 1:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

    # Extract JSON boundary ({...} or [...])
    obj_first = clean.find("{")
    obj_last = clean.rfind("}")
    arr_first = clean.find("[")
    arr_last = clean.rfind("]")

    if obj_first != -1 and obj_last > obj_first and (arr_first == -1 or obj_first < arr_first):
        clean = clean[obj_first:obj_last + 1]
    elif arr_first != -1 and arr_last > arr_first:
        clean = clean[arr_first:arr_last + 1]

    data = json.loads(clean)
    if schema_cls is not None:
        if hasattr(schema_cls, "model_validate"):
            return schema_cls.model_validate(data).model_dump()
        elif hasattr(schema_cls, "parse_obj"):
            return schema_cls.parse_obj(data).dict()
    return data

llm_manager = RotationalLLMManager()
