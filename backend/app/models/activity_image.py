from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.session import Base


class ActivityImage(Base):
    __tablename__ = "activity_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)

    # File info
    file_path = Column(String(500), nullable=False)  # Relative path: uploads/{agency_id}/activities/{activity_id}/{filename}
    file_url = Column(String(500), nullable=True)  # Computed: /uploads/{agency_id}/activities/...

    # Ordering
    display_order = Column(Integer, nullable=False, default=0)
    is_hero = Column(Boolean, default=False, nullable=False)  # Only one image per activity should be True

    # Timestamp
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    activity = relationship("Activity", back_populates="images")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('activity_id', 'display_order', name='uq_activity_image_display_order'),
    )

    def __repr__(self):
        return f"<ActivityImage(id={self.id}, activity_id={self.activity_id}, is_hero={self.is_hero})>"
