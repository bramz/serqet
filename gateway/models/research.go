package models

import "gorm.io/gorm"

type ResearchReports struct {
	gorm.Model
	Query    string `json:"query"`
	Findings string `json:"findings"` // The raw search dump
	Category string `json:"category"` // AI assigned (jobs, finance, etc)
}