import os
import requests
from typing import List, Optional, Dict, Any

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8001")

class SerqetAgent:
    def __init__(self, slug: str):
        self.slug = slug
        self.config = self._fetch_remote_config()
        self.name = self.config.get("name", slug.capitalize()) if self.config else slug.capitalize()

    def _fetch_remote_config(self) -> Optional[Dict[str, Any]]:
        """Hits the Go Gateway to get live DNA (Prompts & Tools)."""
        try:
            # fetch all and filter to reduce API overhead
            resp = requests.get(f"{GATEWAY_URL}/api/v1/agents", timeout=2)
            if resp.status_code == 200:
                agents = resp.json()
                return next((a for a in agents if a['slug'] == self.slug), None)
        except Exception as e:
            print(f"[BRAIN ERROR] Failed to fetch DNA for {self.slug}: {e}")
        return None

    def get_system_prompt(self) -> str:
        """Returns the prompt from Postgres, or a safety fallback."""
        if self.config and self.config.get("system_prompt"):
            return self.config["system_prompt"]
        return f"You are the {self.slug} specialist for Serqet."

    @property
    def allowed_tools(self) -> List[str]:
        """Parses the comma-separated tool string from Postgres."""
        if self.config and self.config.get("allowed_tools"):
            return [t.strip() for t in self.config["allowed_tools"].split(",") if t.strip()]
        return []