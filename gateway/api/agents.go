package api

import (
	"gateway/db"
	"gateway/models"
	"github.com/gofiber/fiber/v3"
	"log"
)

func GetAgents(c fiber.Ctx) error {
	var agents []models.AgentConfig
	db.Instance.Find(&agents)
	return c.JSON(agents)
}

func UpdateAgentPrompt(c fiber.Ctx) error {
	slug := c.Params("slug")
	
	var body struct {
		SystemPrompt string `json:"system_prompt"`
		AllowedTools string `json:"allowed_tools"`
	}

	if err := c.Bind().JSON(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	updates := map[string]interface{}{
		"system_prompt": body.SystemPrompt,
		"allowed_tools": body.AllowedTools,
	}

	result := db.Instance.Model(&models.AgentConfig{}).
		Where("slug = ?", slug).
		Updates(updates)

	if result.Error != nil {
		log.Printf("[DATABASE ERROR] Failed to update agent %s: %v", slug, result.Error)
		return c.Status(500).JSON(fiber.Map{"error": "Internal database error"})
	}

	if result.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Agent not found in registry"})
	}

	log.Printf("[BRAIN] Data updated for specialist: %s", slug)
	return c.JSON(fiber.Map{"status": "Neural path updated successfully"})
}