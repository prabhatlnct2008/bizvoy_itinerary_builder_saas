import os
import uuid
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings


class FileStorage:
    """Local filesystem storage for uploads"""

    @staticmethod
    def get_upload_path(agency_id: str, category: str, entity_id: str) -> str:
        """Get upload directory path for entity"""
        path = os.path.join(
            settings.UPLOAD_DIR,
            "agencies",
            agency_id,
            category,
            entity_id
        )
        os.makedirs(path, exist_ok=True)
        return path

    @staticmethod
    async def save_file(
        file: UploadFile,
        agency_id: str,
        category: str,
        entity_id: str
    ) -> Optional[str]:
        """
        Save uploaded file and return relative path

        Args:
            file: FastAPI UploadFile object
            agency_id: Agency UUID
            category: Category (e.g., 'activities', 'logos')
            entity_id: Entity UUID

        Returns:
            Relative file path or None on error
        """
        try:
            # Validate file size
            contents = await file.read()
            if len(contents) > settings.MAX_UPLOAD_SIZE:
                return None

            # Get file extension
            filename = file.filename or "file"
            ext = os.path.splitext(filename)[1].lower()

            # Validate extension
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
            if ext not in allowed_extensions:
                return None

            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}{ext}"

            # Get upload path
            upload_dir = FileStorage.get_upload_path(agency_id, category, entity_id)
            file_path = os.path.join(upload_dir, unique_filename)

            # Write file
            with open(file_path, 'wb') as f:
                f.write(contents)

            # Return relative path (for database storage and URL generation)
            relative_path = os.path.join(
                "agencies",
                agency_id,
                category,
                entity_id,
                unique_filename
            )

            return relative_path

        except Exception as e:
            print(f"Error saving file: {e}")
            return None

    @staticmethod
    def delete_file(relative_path: str) -> bool:
        """Delete file from storage"""
        try:
            full_path = os.path.join(settings.UPLOAD_DIR, relative_path)
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False

    @staticmethod
    def get_file_url(relative_path: str) -> str:
        """Generate URL for file"""
        return f"/uploads/{relative_path}"


file_storage = FileStorage()
