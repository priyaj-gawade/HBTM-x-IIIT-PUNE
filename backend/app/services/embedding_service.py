"""Embedding Service - pgvector operations for growth memory."""

import asyncio
import logging
from typing import List, Optional
from uuid import UUID

import google.generativeai as genai
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.embedding import Embedding

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for creating and searching vector embeddings using pgvector."""

    async def create_embedding(
        self,
        db: AsyncSession,
        user_id: UUID,
        content: str,
        content_type: str = "reflection",
    ) -> Optional[Embedding]:
        """
        Create an embedding for content and store it in pgvector.
        """
        try:
            # Async non-blocking call via asyncio.to_thread
            result = await asyncio.to_thread(
                genai.embed_content,
                model="models/embedding-001",
                content=content,
                task_type="retrieval_document",
            )
            embedding_vector = result["embedding"]

            # Store in database
            embedding = Embedding(
                user_id=user_id,
                content=content,
                embedding=embedding_vector,
                content_type=content_type,
            )
            db.add(embedding)
            await db.commit()

            logger.info(f"Created {content_type} embedding for user_id={user_id}")
            return embedding

        except Exception as e:
            logger.error(f"Failed to create embedding: {e}")
            return None

    async def search_similar(
        self,
        db: AsyncSession,
        user_id: UUID,
        query: str,
        limit: int = 5,
        content_type: Optional[str] = None,
    ) -> List[str]:
        """
        Search for similar content using vector similarity.
        """
        try:
            # Async non-blocking call via asyncio.to_thread
            result = await asyncio.to_thread(
                genai.embed_content,
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query",
            )
            query_vector = result["embedding"]
            vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"

            if content_type:
                stmt = text(
                    """
                    SELECT content FROM embeddings
                    WHERE user_id = :user_id AND content_type = :content_type
                    ORDER BY embedding <=> :query_vector::vector
                    LIMIT :limit
                    """
                )
                rows = await db.execute(
                    stmt,
                    {
                        "user_id": str(user_id),
                        "content_type": content_type,
                        "query_vector": vector_str,
                        "limit": limit,
                    },
                )
            else:
                stmt = text(
                    """
                    SELECT content FROM embeddings
                    WHERE user_id = :user_id
                    ORDER BY embedding <=> :query_vector::vector
                    LIMIT :limit
                    """
                )
                rows = await db.execute(
                    stmt,
                    {
                        "user_id": str(user_id),
                        "query_vector": vector_str,
                        "limit": limit,
                    },
                )

            results = [row[0] for row in rows.fetchall()]
            logger.info(f"Found {len(results)} similar items for user_id={user_id}")
            return results

        except Exception as e:
            logger.error(f"Failed to search embeddings: {e}")
            return []


# Singleton instance
embedding_service = EmbeddingService()
