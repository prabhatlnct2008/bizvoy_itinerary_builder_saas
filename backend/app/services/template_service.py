from sqlalchemy.orm import Session
from app.models.template import Template
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryDayActivity, ItineraryStatus
from datetime import timedelta
from typing import Optional


class TemplateService:
    @staticmethod
    def create_itinerary_from_template(
        template_id: str,
        trip_name: str,
        client_name: str,
        client_email: Optional[str],
        client_phone: Optional[str],
        start_date,
        num_adults: int,
        num_children: int,
        special_notes: Optional[str],
        created_by: str,
        db: Session,
        # Personalization settings
        personalization_enabled: bool = False,
        personalization_policy: str = "flexible",
        personalization_lock_policy: str = "respect_locks"
    ) -> Itinerary:
        """
        Create an itinerary from a template

        Args:
            template_id: Template to use
            trip_name: Name of the trip
            client_name: Client's name
            client_email: Client's email
            client_phone: Client's phone
            start_date: Start date of the trip
            num_adults: Number of adults
            num_children: Number of children
            special_notes: Any special notes
            created_by: User ID creating the itinerary
            db: Database session

        Returns:
            Created Itinerary object
        """
        # Fetch template with all relationships
        template = db.query(Template).filter(Template.id == template_id).first()
        if not template:
            raise ValueError("Template not found")

        # Calculate end date
        end_date = start_date + timedelta(days=template.duration_days - 1)

        # Create itinerary
        itinerary = Itinerary(
            agency_id=template.agency_id,
            template_id=template.id,
            trip_name=trip_name,
            client_name=client_name,
            client_email=client_email,
            client_phone=client_phone,
            destination=template.destination,
            start_date=start_date,
            end_date=end_date,
            num_adults=num_adults,
            num_children=num_children,
            status=ItineraryStatus.draft,
            total_price=template.approximate_price,
            special_notes=special_notes,
            created_by=created_by,
            # Personalization settings
            personalization_enabled=1 if personalization_enabled else 0,
            personalization_policy=personalization_policy,
            personalization_lock_policy=personalization_lock_policy
        )
        db.add(itinerary)
        db.flush()

        # Create days from template
        for template_day in template.days:
            # Calculate actual date for this day
            actual_date = start_date + timedelta(days=template_day.day_number - 1)

            # Create itinerary day
            itinerary_day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=template_day.day_number,
                actual_date=actual_date,
                title=template_day.title,
                notes=template_day.notes
            )
            db.add(itinerary_day)
            db.flush()

            # Copy activities from template (supports both library and ad-hoc items)
            for template_activity in template_day.activities:
                # Preserve item_type from template (supports LOGISTICS, NOTE items)
                item_type = getattr(template_activity, 'item_type', 'LIBRARY_ACTIVITY') or 'LIBRARY_ACTIVITY'
                linked_activity = getattr(template_activity, "activity", None)

                itinerary_activity = ItineraryDayActivity(
                    itinerary_day_id=itinerary_day.id,
                    activity_id=template_activity.activity_id,  # Can be None for ad-hoc items
                    item_type=item_type,
                    # Copy custom fields for ad-hoc items
                    custom_title=template_activity.custom_title,
                    custom_payload=template_activity.custom_payload,
                    custom_icon=template_activity.custom_icon,
                    display_order=template_activity.display_order,
                    time_slot=template_activity.time_slot,
                    custom_notes=template_activity.custom_notes,
                    custom_price=None,  # Can be customized later
                    price_amount=getattr(template_activity, "price_amount", None) or (
                        getattr(template_activity, "custom_price", None)
                        if hasattr(template_activity, "custom_price")
                        else None
                    ) or (linked_activity.price_numeric if linked_activity else None),
                    price_currency=getattr(template_activity, "price_currency", None)
                    or (linked_activity.currency_code if linked_activity else None)
                    or "USD",
                    pricing_unit=getattr(template_activity, "pricing_unit", None) or "flat",
                    quantity=getattr(template_activity, "quantity", None) or 1,
                    item_discount_amount=getattr(template_activity, "item_discount_amount", None),
                    # Copy time fields from template
                    start_time=template_activity.start_time,
                    end_time=template_activity.end_time,
                    is_locked_by_agency=template_activity.is_locked_by_agency
                )
                db.add(itinerary_activity)

        db.commit()
        db.refresh(itinerary)

        return itinerary


template_service = TemplateService()
