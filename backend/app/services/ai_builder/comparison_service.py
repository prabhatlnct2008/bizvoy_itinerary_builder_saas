"""
AI Comparison Service

Compares AI-generated draft activities with existing library activities using LLM.
Only marks activities as "match" if they are highly similar (same venue/experience).
"""
import json
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_builder import AIBuilderSession, AIBuilderDraftActivity
from app.models.activity import Activity
from app.services.search_service import SearchService

logger = logging.getLogger(__name__)


@dataclass
class SearchMatch:
    """A potential match from search"""
    activity_id: str
    name: str
    location: str
    short_description: str
    score: float


@dataclass
class ComparisonResult:
    """Result of LLM comparison"""
    is_match: bool
    matched_activity_id: Optional[str]
    match_score: float
    reasoning: str


class AIComparisonService:
    """Compares draft activities with existing library using LLM"""

    def __init__(self):
        self.client = self._safe_openai_client()
        self.search_service = SearchService()

    def _safe_openai_client(self) -> Optional[OpenAI]:
        """Instantiate OpenAI client if key is present."""
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            logger.warning("OpenAI API key not configured")
            return None
        try:
            return OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            return None

    def _search_existing_activities(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        db: Session,
        limit: int = 5
    ) -> List[SearchMatch]:
        """Search for potentially matching existing activities"""
        matches = []

        # Build search query from draft
        search_query = draft.name
        if draft.location_display:
            search_query += f" {draft.location_display}"

        try:
            # Use semantic search
            search_results = self.search_service.search_activities(
                query=search_query,
                agency_id=agency_id,
                limit=limit
            )

            for result in search_results:
                # Fetch full activity details
                activity = db.query(Activity).filter(
                    Activity.id == result.get("id")
                ).first()

                if activity:
                    matches.append(SearchMatch(
                        activity_id=activity.id,
                        name=activity.name,
                        location=activity.location_display or "",
                        short_description=activity.short_description or "",
                        score=result.get("score", 0.0)
                    ))

        except Exception as e:
            logger.warning(f"Search failed for draft {draft.id}: {e}")

        return matches

    def _build_comparison_prompt(
        self,
        draft: AIBuilderDraftActivity,
        candidates: List[SearchMatch]
    ) -> str:
        """Build prompt for LLM comparison"""

        # Format draft activity
        draft_info = f"""
## NEW Activity (from trip content):
- Name: {draft.name}
- Location: {draft.location_display or 'Not specified'}
- Description: {draft.short_description or 'Not provided'}
- Category: {draft.category_label or 'Not specified'}
- Duration: {draft.default_duration_value or '?'} {draft.default_duration_unit or 'minutes'}
"""

        # Format candidates
        candidates_info = "\n## EXISTING Activities in Library:\n"
        for i, c in enumerate(candidates, 1):
            candidates_info += f"""
### Candidate {i} (ID: {c.activity_id})
- Name: {c.name}
- Location: {c.location or 'Not specified'}
- Description: {c.short_description or 'Not provided'}
- Search Score: {c.score:.2f}
"""

        prompt = f"""You are an activity matching expert for a travel agency.

Your task: Determine if the NEW activity is THE SAME as any of the EXISTING activities.

IMPORTANT MATCHING RULES:
1. **SAME = Identical venue/experience** (e.g., both are "Colosseum Tour" at the Colosseum in Rome)
2. **NOT SAME = Similar but different** (e.g., "Rome Walking Tour" vs "Colosseum Tour" - different activities)
3. **NOT SAME = Same type, different place** (e.g., "Hotel Roma" vs "Hotel Napoli" - different hotels)
4. **NOT SAME = Generic vs Specific** (e.g., "Dinner in Rome" vs "Dinner at Aromaticus" - keep both)

Only match if you are HIGHLY CONFIDENT (>85%) they refer to the exact same thing.

{draft_info}

{candidates_info}

## Response Format (JSON only, no markdown):
{{
  "is_match": true/false,
  "matched_candidate_number": 1 or null,
  "match_score": 0.0 to 1.0,
  "reasoning": "One sentence explaining your decision"
}}

If no match, set is_match=false, matched_candidate_number=null, match_score=0.0"""

        return prompt

    def compare_draft_with_library(
        self,
        draft: AIBuilderDraftActivity,
        agency_id: str,
        db: Session
    ) -> ComparisonResult:
        """
        Compare a single draft activity with existing library.

        Returns ComparisonResult with match details.
        """
        # Search for candidates
        candidates = self._search_existing_activities(draft, agency_id, db)

        if not candidates:
            return ComparisonResult(
                is_match=False,
                matched_activity_id=None,
                match_score=0.0,
                reasoning="No similar activities found in library"
            )

        if not self.client:
            # Fallback: use search score as match indicator
            best = candidates[0]
            if best.score > 0.85:
                return ComparisonResult(
                    is_match=True,
                    matched_activity_id=best.activity_id,
                    match_score=best.score,
                    reasoning="Matched by search similarity (AI unavailable)"
                )
            return ComparisonResult(
                is_match=False,
                matched_activity_id=None,
                match_score=0.0,
                reasoning="No high-confidence match found"
            )

        try:
            # Build comparison prompt
            prompt = self._build_comparison_prompt(draft, candidates)

            # Call LLM for comparison
            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert at matching travel activities.
Be CONSERVATIVE - only match if you are very confident they are the SAME activity.
Reply ONLY with valid JSON."""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent matching
                max_tokens=200
            )

            response_text = completion.choices[0].message.content if completion.choices else ""

            # Clean and parse response
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            result = json.loads(response_text)

            is_match = result.get("is_match", False)
            candidate_num = result.get("matched_candidate_number")
            match_score = result.get("match_score", 0.0)
            reasoning = result.get("reasoning", "")

            if is_match and candidate_num and 1 <= candidate_num <= len(candidates):
                matched_activity_id = candidates[candidate_num - 1].activity_id
            else:
                matched_activity_id = None
                is_match = False

            return ComparisonResult(
                is_match=is_match,
                matched_activity_id=matched_activity_id,
                match_score=match_score,
                reasoning=reasoning
            )

        except Exception as e:
            logger.error(f"LLM comparison failed: {e}")
            return ComparisonResult(
                is_match=False,
                matched_activity_id=None,
                match_score=0.0,
                reasoning=f"Comparison failed: {str(e)}"
            )

    def compare_all_drafts(
        self,
        session: AIBuilderSession,
        db: Session
    ) -> Dict[str, Any]:
        """
        Compare all draft activities in a session with existing library.

        Updates draft activities with match results.
        Returns summary statistics.
        """
        drafts = session.draft_activities
        stats = {
            "total": len(drafts),
            "matched": 0,
            "new": 0,
            "errors": 0
        }

        for draft in drafts:
            try:
                result = self.compare_draft_with_library(
                    draft=draft,
                    agency_id=session.agency_id,
                    db=db
                )

                # Update draft with results
                draft.matched_activity_id = result.matched_activity_id
                draft.match_score = result.match_score
                draft.match_reasoning = result.reasoning

                if result.is_match:
                    stats["matched"] += 1
                else:
                    stats["new"] += 1

            except Exception as e:
                logger.error(f"Failed to compare draft {draft.id}: {e}")
                stats["errors"] += 1
                draft.match_reasoning = f"Comparison error: {str(e)}"

        db.commit()
        return stats


# Singleton instance
_comparison_service = None


def get_comparison_service() -> AIComparisonService:
    """Get or create comparison service singleton"""
    global _comparison_service
    if _comparison_service is None:
        _comparison_service = AIComparisonService()
    return _comparison_service
