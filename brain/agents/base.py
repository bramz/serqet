import os
import logging
import requests
from typing import List, Optional, Dict, Any
 
logger = logging.getLogger(__name__)
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8001")
 
class SerqetAgent:
    def __init__(self, slug: str):
        self.slug = slug
        self.config: Optional[Dict[str, Any]] = self._fetch_config()
        self.name: str = self.config.get("name", slug.capitalize()) if self.config else slug.capitalize()
 
    def _fetch_config(self) -> Optional[Dict[str, Any]]:
        """Fetch this agent's config directly by slug to avoid loading all agents."""
        try:
            resp = requests.get(
                f"{GATEWAY_URL}/api/v1/agents",
                timeout=2
            )
            resp.raise_for_status()
            agents = resp.json()
            return next((a for a in agents if a["slug"] == self.slug), None)
        except requests.RequestException as e:
            logger.warning("[AGENT] Config fetch failed for %s: %s", self.slug, e)
        return None
 
    def get_system_prompt(self) -> str:
        if self.config and self.config.get("system_prompt"):
            return self.config["system_prompt"]
        return f"You are the {self.slug} specialist for Serqet OS."
 
    @property
    def allowed_tools(self) -> List[str]:
        if self.config and self.config.get("allowed_tools"):
            return [t.strip() for t in self.config["allowed_tools"].split(",") if t.strip()]
        return []
