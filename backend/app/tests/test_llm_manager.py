import pytest
import google.generativeai as genai
from unittest.mock import AsyncMock, patch, MagicMock

from app.utils.llm_manager import RotationalLLMManager
from app.utils.config import settings

class MockResponse:
    def __init__(self, text):
        self.text = text

@pytest.mark.asyncio
async def test_llm_manager_rotation():
    """Test that the RotationalLLMManager rotates API keys on a 429 quota error."""
    # Create a fresh manager with dummy keys
    manager = RotationalLLMManager()
    manager.keys = ["KEY_A", "KEY_B", "KEY_C"]
    manager.current_idx = 0

    # Mock genai.configure to track what key is set
    with patch("app.utils.llm_manager.genai.configure") as mock_configure:
        
        # We will mock the GenerativeModel class itself
        with patch("app.utils.llm_manager.genai.GenerativeModel") as MockModel:
            
            mock_model_instance = MagicMock()
            MockModel.return_value = mock_model_instance
            
            # The async generate_content_async should fail on the first call (429), succeed on the second
            mock_model_instance.generate_content_async = AsyncMock(
                side_effect=[
                    Exception("429 Resource Exhausted"),
                    MockResponse("Success on second try!")
                ]
            )

            # Execute
            result = await manager.generate_content_async(prompt="Hello")

            # Asserts
            assert result.text == "Success on second try!"
            
            # Should have called configure twice: first with KEY_A, then with KEY_B
            assert mock_configure.call_count == 2
            mock_configure.assert_any_call(api_key="KEY_A")
            mock_configure.assert_any_call(api_key="KEY_B")
            
            # Index should have rotated
            assert manager.current_idx == 1

@pytest.mark.asyncio
async def test_llm_manager_all_keys_fail():
    """Test that the RotationalLLMManager raises an exception if all keys fail."""
    manager = RotationalLLMManager()
    manager.keys = ["KEY_A", "KEY_B"]
    manager.current_idx = 0

    with patch("app.utils.llm_manager.genai.configure"):
        with patch("app.utils.llm_manager.genai.GenerativeModel") as MockModel:
            mock_model_instance = MagicMock()
            MockModel.return_value = mock_model_instance
            
            # Always fail with 429
            mock_model_instance.generate_content_async = AsyncMock(
                side_effect=Exception("429 Resource Exhausted")
            )

            with pytest.raises(Exception, match="429 Resource Exhausted"):
                await manager.generate_content_async(prompt="Hello")
                
            # Current index should be back to 0 (0 -> 1 -> 0)
            assert manager.current_idx == 0
