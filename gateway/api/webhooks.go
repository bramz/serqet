package api

import (
	"fmt"
	"gateway/services"

	"github.com/gofiber/fiber/v3"
)

func ExternalSignalHandler(c fiber.Ctx) error {
	source := c.Params("source") // e.g., "n8n", "github"
	var payload map[string]interface{}
	c.Bind().JSON(&payload)

	// Emit a system event so it shows in the UI immediately
	services.EmitEvent("EXTERNAL", fmt.Sprintf("Signal received from %s", source), "INFO")

	// Trigger the Brain automatically to analyze the signal
	// e.g., "An external signal from n8n says: 'New Email from Boss'. What should I do?"
	return c.JSON(fiber.Map{"status": "captured"})
}