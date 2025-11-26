# Optional imports for semantic search (requires chromadb and openai)
try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    print("Warning: chromadb not available. Semantic search will be disabled.")

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai not available. Semantic search will be disabled.")

from typing import List, Dict, Optional
from app.core.config import settings
from app.models.activity import Activity
from sqlalchemy.orm import Session
import json


class SearchService:
    def __init__(self):
        """Initialize ChromaDB client and OpenAI client (if available)"""
        self.chroma_client = None
        self.openai_client = None

        if CHROMADB_AVAILABLE:
            try:
                self.chroma_client = chromadb.PersistentClient(
                    path=settings.CHROMADB_PERSIST_DIR,
                    settings=Settings(anonymized_telemetry=False)
                )
            except Exception as e:
                print(f"Failed to initialize ChromaDB: {e}")

        if OPENAI_AVAILABLE:
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")

    def get_collection_name(self, agency_id: str) -> str:
        """Get collection name for agency"""
        return f"activities_{agency_id}"

    def get_or_create_collection(self, agency_id: str):
        """Get or create collection for agency"""
        collection_name = self.get_collection_name(agency_id)
        return self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"agency_id": agency_id}
        )

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI"""
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model=settings.EMBEDDING_MODEL
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None

    def index_activity(self, activity: Activity) -> bool:
        """Add or update activity in ChromaDB"""
        try:
            # Prepare text for embedding
            text_parts = [activity.name]
            if activity.short_description:
                text_parts.append(activity.short_description)
            if activity.highlights:
                text_parts.append(activity.highlights)
            if activity.location:
                text_parts.append(activity.location)

            text = " ".join(text_parts)

            # Generate embedding
            embedding = self.generate_embedding(text)
            if not embedding:
                return False

            # Get collection
            collection = self.get_or_create_collection(activity.agency_id)

            # Prepare metadata
            metadata = {
                "activity_id": activity.id,
                "name": activity.name,
                "location": activity.location or "",
                "is_active": str(activity.is_active),
            }

            if activity.activity_type_id:
                metadata["activity_type_id"] = activity.activity_type_id
            if activity.tags:
                metadata["tags"] = activity.tags

            # Upsert to collection
            collection.upsert(
                ids=[activity.id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[text]
            )

            return True
        except Exception as e:
            print(f"Error indexing activity: {e}")
            return False

    def search_activities(
        self,
        agency_id: str,
        query: str,
        limit: int = 20,
        db: Session = None
    ) -> List[Dict]:
        """Search activities using semantic search"""
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            if not query_embedding:
                return []

            # Get collection
            collection = self.get_or_create_collection(agency_id)

            # Check if collection is empty
            if collection.count() == 0:
                return []

            # Query collection
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(limit, collection.count())
            )

            # Extract activity IDs
            if not results or not results.get('ids') or not results['ids'][0]:
                return []

            activity_ids = results['ids'][0]
            distances = results['distances'][0] if results.get('distances') else []

            # If database session provided, fetch full activity objects
            if db:
                activities = db.query(Activity).filter(
                    Activity.id.in_(activity_ids),
                    Activity.agency_id == agency_id
                ).all()

                # Create a dict for quick lookup
                activity_dict = {a.id: a for a in activities}

                # Return activities in order of similarity with scores
                result_list = []
                for i, activity_id in enumerate(activity_ids):
                    if activity_id in activity_dict:
                        activity = activity_dict[activity_id]
                        result_list.append({
                            "activity": activity,
                            "similarity_score": 1 - distances[i] if i < len(distances) else 0
                        })

                return result_list
            else:
                # Return just IDs and scores
                return [
                    {
                        "activity_id": activity_ids[i],
                        "similarity_score": 1 - distances[i] if i < len(distances) else 0
                    }
                    for i in range(len(activity_ids))
                ]

        except Exception as e:
            print(f"Error searching activities: {e}")
            return []

    def delete_activity(self, agency_id: str, activity_id: str) -> bool:
        """Delete activity from ChromaDB"""
        try:
            collection = self.get_or_create_collection(agency_id)
            collection.delete(ids=[activity_id])
            return True
        except Exception as e:
            print(f"Error deleting activity from search index: {e}")
            return False

    def reindex_all_activities(self, agency_id: str, db: Session) -> int:
        """Reindex all activities for an agency"""
        activities = db.query(Activity).filter(
            Activity.agency_id == agency_id,
            Activity.is_active == True
        ).all()

        count = 0
        for activity in activities:
            if self.index_activity(activity):
                count += 1

        return count


# Singleton instance
search_service = SearchService()
