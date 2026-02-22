package services

import (
	"bytes"
	"encoding/json"
	"net/http"
	"gateway/models"
)

type BrainResponse struct {
	Message string                 `json:"message"`
	Action  string                 `json:"action"`
	Data    map[string]interface{} `json:"data"`
}

func RequestIntent(userID string, query string, history []models.ChatHistory) (*BrainResponse, error) {
	// Map DB history to the Brain's expected format
	var brainHistory []map[string]string
	for _, h := range history {
		brainHistory = append(brainHistory, map[string]string{"role": h.Role, "text": h.Text})
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"user_id": userID,
		"query":   query,
		"history": brainHistory,
	})

	resp, err := http.Post("http://localhost:8000/brain/v1/process_intent", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result BrainResponse
	json.NewDecoder(resp.Body).Decode(&result)
	return &result, nil
}