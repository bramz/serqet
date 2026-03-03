package api

import (
	"gateway/models"
	"github.com/gofiber/fiber/v3"
)

var activeModules = []models.Module{
	{ID: "social", Name: "Social Media", Description: "Manage social presence.", Icon: "social"},
	{ID: "finance", Name: "Finances", Description: "Track income and expenses.", Icon: "finance"},
	{ID: "research", Name: "Research", Description: "Conduct web research.", Icon: "research"},
	{ID: "tasks", Name: "Tasks", Description: "Organize to-dos.", Icon: "task"},
	{ID: "jobs", Name: "Jobs", Description: "Track job applications.", Icon: "jobs"},
	{ID: "health", Name: "Health", Description: "Monitor diet and workouts.", Icon: "health"},
}

func GetModules(c fiber.Ctx) error {
	return c.JSON(activeModules)
}