package services

import (
	"gateway/db"
	"gateway/models"
	"log"
	"strconv"
	"time"
	"fmt"
)

func StartAutonomousAnalyst() {
	// Analyze markets every 4 hours to avoid over-trading/spam
	ticker := time.NewTicker(4 * time.Hour)
	// ticker := time.NewTicker(1 * time.Minute) // 1 minute for testing


	go func() {
		for range ticker.C {
			pairs := []string{"XXBTZUSD", "XETHZUSD"}
			
			for _, pair := range pairs {
				log.Printf("[ANALYST] Fetching data for %s...", pair)
				candles, err := FetchMarketCandles(pair)
				if err != nil {
					log.Printf("[ERROR] Market fetch failed: %v", err)
					continue
				}

				log.Printf("[ANALYST] Sending %d candles to Brain for %s", len(candles), pair)
				
				query := fmt.Sprintf("System Market Analysis: %s", pair)
				
				RequestIntent("SYSTEM_BOT", query, "", "", nil) 
                // Note: expand RequestIntent to accept a 'data' payload 
                // to avoid sending 500 candles as text
			}
		}
	}()
}

func StartBackgroundWorker() {
	ticker := time.NewTicker(60 * time.Minute)

	go func() {
		for range ticker.C {
			log.Println("[WORKER] Starting automated Kraken sync...")
			balances, err := FetchKrakenBalances()
			if err != nil {
				log.Printf("[WORKER ERROR] Kraken sync failed: %v", err)
				continue
			}

			for asset, val := range balances {
				amountFloat, err := strconv.ParseFloat(val, 64)
				if err == nil && amountFloat > 0 {
					db.Instance.Where(models.CryptoHoldings{Asset: asset}).
						Assign(models.CryptoHoldings{Balance: amountFloat}).
						FirstOrCreate(&models.CryptoHoldings{})
				}
			}
			log.Println("[WORKER] Automated Kraken sync complete.")
		}
	}()
}

// StartKernelHeartbeat initializes the proactive automation loops
func StartBrainHeartbeat() {
	log.Println("[BRAIN] Autonomous heartbeat initialized")

	// 1. Minute-level loop (High Frequency tasks)
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for range ticker.C {
			// Trigger High-Frequency market analysis if enabled
			// processSystemTask("Perform a rapid market scan for BTC/USD signals.")
		}
	}()

	// 2. Hourly-level loop (Maintenance)
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			now := time.Now()
			
			// Morning Intelligence (8:00 AM)
			if now.Hour() == 8 {
				processSystemTask("Generate a Morning Briefing: Check my portfolio, today's tasks, and latest tech news.")
			}

			// Mid-day Productivity Check
			if now.Hour() == 13 {
				processSystemTask("Check if I have logged nutrition data for today. If not, prompt me.")
			}

			// Evening Analysis
			if now.Hour() == 21 {
				processSystemTask("Review all ventures and trading signals from today. Summarize the ROI.")
			}
		}
	}()

	// 3. Daily Security Sweep (3:00 AM)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		for range ticker.C {
			processSystemTask("Boot the Vanguard Agent. Run a full security audit of my digital footprint and OS memory.")
		}
	}()
}

// processSystemTask sends a request to the Brain as the 'SYSTEM' user
func processSystemTask(query string) {
	log.Printf("[CRON] Executing Autonomous Task: %s", query)
	
	// We use 'SYSTEM_CORE' as the user ID so the Brain knows it's autonomous
	// We use the 'default' session so results appear in your main chat
	res, err := RequestIntent("SYSTEM_CORE", "default", query, "", []models.ChatHistory{})
	if err != nil {
		log.Printf("[CRON ERROR] Task failed: %v", err)
		return
	}

	// If the Brain suggests a tool execution (like saving a report), the Kernel does it
	if res.Action != "" {
		ExecuteToolCall(res.Action, res.Data)
	}
	
	// Emit a log event so it shows up in the Dashboard logs immediately
	EmitEvent("BRAIN", "Proactive Task Completed: "+query[:30]+"...", "SUCCESS")
}