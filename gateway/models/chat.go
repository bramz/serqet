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
	UserID    string `json:"user_id" gorm:"index"`
	SessionID string `json:"session_id" gorm:"index"`
	Role      string `json:"role"`
	Text      string `json:"text"`
	FilePath  string `json:"file_path"`
	AudioURL  string `json:"audio_url"`
}