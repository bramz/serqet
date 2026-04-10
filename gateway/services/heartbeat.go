package services

import (
	"gateway/models"
	"log"
	"time"
)

func StartHeartbeat() {
	log.Println("[BRAIN] Autonomic Heartbeat Online")

	// Trigger specialized checks at specific intervals
	go cronLoop(15*time.Minute, "Check crypto volatility and update signals.")
	go cronLoop(4*time.Hour, "Research top 3 trending Go/Python/AI technical breakthroughs.")
	
	// Time-of-day Specific Logic
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for range ticker.C {
			now := time.Now()
			// 08:00 AM - Morning Synthesis
			if now.Hour() == 8 && now.Minute() == 0 {
				DispatchSystemIntent("Generate an Executive Morning Briefing: Net worth, Pending Actions, and Health targets.")
			}
			// 09:00 PM - Evening Reflection
			if now.Hour() == 21 && now.Minute() == 0 {
				DispatchSystemIntent("Audit all today's system events and summarize ROI for active ventures.")
			}
		}
	}()
}

func cronLoop(interval time.Duration, query string) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		DispatchSystemIntent(query)
	}
}

func DispatchSystemIntent(query string) {
	log.Printf("[HEARTBEAT] Dispatching: %s", query)
	// We use SYSTEM_CORE as user to bypass certain UI-only logic
	res, err := RequestIntent("SYSTEM_CORE", "autonomous_stream", query, "", []models.ChatHistory{})
	if err != nil {
		log.Printf("[HEARTBEAT ERROR] %v", err)
		return
	}
	// If the Brain returned an action, execute it immediately
	if res.Action != "" {
		ExecuteToolCall(res.Action, res.Data)
	}
}