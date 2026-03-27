package api

import (
	"gateway/db"
	"gateway/models"
	"github.com/gofiber/fiber/v3"
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
	}
	c.Bind().JSON(&body)

	db.Instance.Model(&models.AgentConfig{}).Where("slug = ?", slug).Update("system_prompt", body.SystemPrompt)
	return c.JSON(fiber.Map{"status": "Neural path updated"})
}