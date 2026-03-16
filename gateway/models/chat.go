package models

import (
	"gorm.io/gorm"
)

// type ChatHistory struct {
// 	Base
// 	UserID string `json:"user_id"`
// 	Role   string `json:"role"` // "user" or "serqet"
// 	Text   string `json:"text"`
// }

type ChatSession struct {
    gorm.Model
    Title string `json:"title"`
    Type  string `json:"type"` // "finance", "research", etc.
}

type ChatHistory struct {
	gorm.Model
	UserID    string `json:"user_id" gorm:"index"`
	SessionID string `json:"session_id" gorm:"index"` // Change this from uint to string
	Role      string `json:"role"`
	Text      string `json:"text"`
}