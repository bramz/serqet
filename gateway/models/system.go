package models

import "gorm.io/gorm"

type SystemEvent struct {
	gorm.Model
	Source  string `json:"source"`  // e.g., "BRAIN", "KRAKEN", "KERNEL"
	Message string `json:"message"`
	Level   string `json:"level"`   // "INFO", "WARN", "CRITICAL"
}