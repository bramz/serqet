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
	// ticker := time.NewTicker(4 * time.Hour)
	ticker := time.NewTicker(1 * time.Minute) // 1 minute for testing


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

				// Forward to Brain for "Autonomous Intent"
				// We simulate a system query to the Brain
				log.Printf("[ANALYST] Sending %d candles to Brain for %s", len(candles), pair)
				
				// We reuse our existing Brain client but with a special query
				query := fmt.Sprintf("System Market Analysis: %s", pair)
				
				// We pass the candles as Data so the AI Tools can pick it up
				RequestIntent("SYSTEM_BOT", query, nil) 
                // Note: You may want to expand RequestIntent to accept a 'data' payload 
                // to avoid sending 500 candles as text!
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


