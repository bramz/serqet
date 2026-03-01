package models
type ResearchReports struct {
	Base
	Query    string `json:"query"`
	Findings string `json:"findings"` // The raw search dump
	Category string `json:"category"` // AI assigned (jobs, finance, etc)
}