package services

// Consolidated worker — replaces the overlapping scheduler.go + worker.go.
// Three independent goroutines handle different cadences:
//   1. Hourly:  Kraken portfolio sync + time-based briefings
//   2. Daily:   Security audit (3 AM)
//   3. Manual:  StartAutonomousAnalyst() stays commented-out until
//               RequestIntent can accept a raw data payload.

import (
	"gateway/db"
	"gateway/models"
	"log"
	"strconv"
	"time"
)

// StartBrainHeartbeat initialises all proactive background loops.
func StartBrainHeartbeat() {
	log.Println("[HEARTBEAT] Autonomous loops initialised")
	go hourlyCadence()
	go dailyCadence()
}

func hourlyCadence() {
	sync := time.NewTicker(60 * time.Minute)
	for range sync.C {
		syncKraken()

		switch time.Now().Hour() {
		case 8:
			processSystemTask("Generate Morning Briefing: portfolio summary, today's tasks, top tech news.")
		case 13:
			processSystemTask("Check if nutrition has been logged today. Prompt me if not.")
		case 21:
			processSystemTask("Review all ventures and trading signals from today. Summarise the ROI.")
		}
	}
}

func dailyCadence() {
	ticker := time.NewTicker(24 * time.Hour)
	for range ticker.C {
		if time.Now().Hour() == 3 {
			processSystemTask("Boot Vanguard Agent. Run full security audit of digital footprint.")
		}
	}
}

func syncKraken() {
	balances, err := FetchKrakenBalances()
	if err != nil {
		log.Printf("[WORKER] Kraken sync failed: %v", err)
		return
	}
	for asset, val := range balances {
		amount, err := strconv.ParseFloat(val, 64)
		if err != nil || amount <= 0 {
			continue
		}
		db.Instance.
			Where(models.CryptoHoldings{Asset: asset}).
			Assign(models.CryptoHoldings{Balance: amount}).
			FirstOrCreate(&models.CryptoHoldings{})
	}
	log.Println("[WORKER] Kraken sync complete")
}

func processSystemTask(query string) {
	log.Printf("[CRON] %s", query)
	res, err := RequestIntent("SYSTEM_CORE", "default", query, "", []models.ChatHistory{})
	if err != nil {
		log.Printf("[CRON ERROR] %v", err)
		return
	}
	if res.Action != "" {
		ExecuteToolCall(res.Action, res.Data)
	}
	if len(query) > 30 {
		EmitEvent("BRAIN", "Proactive task: "+query[:30]+"...", "SUCCESS")
	}
}
