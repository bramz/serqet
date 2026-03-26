package services

import (
	"bytes"
	"encoding/json"
	"gateway/models"
	"log"
	"net/http"
)

type BrainResponse struct {
	Message  string                 `json:"message"`
	Action   string                 `json:"action"`
	Data     map[string]interface{} `json:"data"`
	AudioURL string                 `json:"audio_url"`
}

func RequestIntent(
	userID string,
	sessionID string,
	query string,
	filePath string,
	history []models.ChatHistory,
) (*BrainResponse, error) {
	var brainHistory []map[string]string
	for _, h := range history {
		brainHistory = append(brainHistory, map[string]string{
			"role": h.Role, 
			"text": h.Text,
		})
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"user_id":    userID,
		"session_id": sessionID, 
		"query":      query,
		"file_path":  filePath,
		"history":    brainHistory,
	})
	
	log.Printf("[BRAIN LINK] Sending Intent: Session=%s | File=%s\n", sessionID, filePath)

	resp, err := http.Post("http://localhost:8000/brain/v1/process_intent", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		log.Printf("[BRAIN ERROR] Connection failed: %v\n", err)
		return nil, err
	}
	defer resp.Body.Close()

	var result BrainResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("[BRAIN ERROR] Decode failed: %v\n", err)
		return nil, err
	}

	return &result, nil
}