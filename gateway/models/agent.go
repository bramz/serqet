package models

import "gorm.io/gorm"

type AgentConfig struct {
	gorm.Model
	Slug         string `json:"slug" gorm:"uniqueIndex"` 
	Name         string `json:"name"`
	SystemPrompt string `json:"system_prompt" gorm:"type:text"`
	AllowedTools string `json:"allowed_tools"` // Stored as a comma-separated string: "web_research,launch_venture"
	Temperature  float64 `json:"temperature"`
}