package models

import "gorm.io/gorm"

type ChatSession struct {
	gorm.Model
	SessionID string `json:"session_id" gorm:"uniqueIndex"`
	Title     string `json:"title"`
	UserID    string `json:"user_id"`
}

type ChatHistory struct {
	gorm.Model
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id" gorm:"index"` // Linked to ChatSession
	Role      string `json:"role"`    // "user" or "serqet"
	Text      string `json:"text"`
}