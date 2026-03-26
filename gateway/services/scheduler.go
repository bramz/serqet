package services

import (
	"log"
	"time"
)

func StartExecutiveScheduler() {
	// every 30 mins
	ticker := time.NewTicker(30 * time.Minute)

	go func() {
		for range ticker.C {
			now := time.Now()
			
			// morning 8am 
			if now.Hour() == 8 && now.Minute() < 30 {
				triggerProactiveQuery("Generate a morning briefing and ask for today's goals.")
			}

			// evening 9pm
			if now.Hour() == 21 && now.Minute() < 30 {
				triggerProactiveQuery("Review today's completed tasks and ask for a reflection.")
			}
            
            // random
            if now.Hour() == 14 {
                triggerProactiveQuery("Check if I've been productive today and suggest a task to focus on.")
            }
		}
	}()
}

func triggerProactiveQuery(prompt string) {
	log.Printf("[EXECUTIVE] Triggering: %s", prompt)
	RequestIntent("SYSTEM_MANAGER", prompt, "", "", nil)
}