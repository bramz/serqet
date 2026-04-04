package models

import "gorm.io/gorm"

type PendingAction struct {
	gorm.Model
	Type     string `json:"type"`
	Title    string `json:"title"`     
	Content  string `json:"content" gorm:"type:text"`   
	Status   string `json:"status"`
	Priority string `json:"priority"`  
}