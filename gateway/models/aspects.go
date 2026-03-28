package models

import "gorm.io/gorm"

// Vanguard: Privacy/Security logs
type SecurityAudit struct {
	gorm.Model
	Issue    string `json:"issue"`
	Severity string `json:"severity"` // "Low", "Medium", "High", "Critical"
	Status   string `json:"status"`   // "Open", "Patched"
}

// Oracle: Knowledge Base
type KnowledgeNode struct {
	gorm.Model
	Topic    string `json:"topic" gorm:"index"`
	Content  string `json:"content" gorm:"type:text"`
	Tags     string `json:"tags"`
}

// Builder: Code/Automation logs
type CodeSnippet struct {
	gorm.Model
	FileName    string `json:"file_name"`
	Language    string `json:"language"`
	Code        string `json:"code" gorm:"type:text"`
	Description string `json:"description"`
}