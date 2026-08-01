import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.utils.llm_manager import RotationalLLMManager

class MockResponse:
    def __init__(self, text):
        self.text = text

@pytest.mark.asyncio
async def test_llm_manager_rotation():
    """Test that the RotationalLLMManager rotates API keys on a 429 quota error."""
    manager = RotationalLLMManager()
    manager.keys = ["KEY_A", "KEY_B", "KEY_C"]
    manager.current_idx = 0

    mock_client_a = MagicMock()
    mock_client_a.aio.models.generate_content = AsyncMock(side_effect=Exception("429 Resource Exhausted"))

    mock_client_b = MagicMock()
    mock_client_b.aio.models.generate_content = AsyncMock(return_value=MockResponse("Success on second try!"))

    clients = {"KEY_A": mock_client_a, "KEY_B": mock_client_b}

    with patch.object(manager, "_get_client", side_effect=lambda k: clients[k]):
        result = await manager.generate_content_async(prompt="Hello")

        assert result.text == "Success on second try!"
        assert manager.current_idx == 1

@pytest.mark.asyncio
async def test_llm_manager_all_keys_fail():
    """Test that the RotationalLLMManager raises an exception if all keys fail."""
    manager = RotationalLLMManager()
    manager.keys = ["KEY_A", "KEY_B"]
    manager.current_idx = 0

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=Exception("429 Quota Exceeded"))

    with patch.object(manager, "_get_client", return_value=mock_client):
        with pytest.raises(Exception, match="429 Quota Exceeded"):
            await manager.generate_content_async(prompt="Hello")
