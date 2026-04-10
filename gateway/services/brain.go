package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"gateway/models"
	"log"
	"net/http"
	"os"
	"time"
)

type BrainResponse struct {
	Message  string                 `json:"message"`
	Action   string                 `json:"action"`
	Data     map[string]interface{} `json:"data"`
	AudioURL string                 `json:"audio_url"`
}

var brainHTTPClient = &http.Client{Timeout: 60 * time.Second}

func brainURL() string {
	if u := os.Getenv("BRAIN_URL"); u != "" {
		return u
	}
	return "http://localhost:8000"
}

func RequestIntent(
	userID, sessionID, query, filePath string,
	history []models.ChatHistory,
) (*BrainResponse, error) {
	msgs := make([]map[string]string, len(history))

	for i, h := range history {
		msgs[i] = map[string]string{"role": h.Role, "text": h.Text}
	}

	payload, err := json.Marshal(map[string]interface{}{
		"user_id":    userID,
		"session_id": sessionID,
		"query":      query,
		"file_path":  filePath,
		"history":    msgs,
	})

	if err != nil {
		return nil, fmt.Errorf("marshal payload: %w", err)
	}

	log.Printf("[BRAIN] Intent session=%s file=%s", sessionID, filePath)

	resp, err := brainHTTPClient.Post(
		brainURL()+"/brain/v1/process_intent",
		"application/json",
		bytes.NewBuffer(payload),
	)

	if err != nil {
		return nil, fmt.Errorf("brain request: %w", err)
	}

	defer resp.Body.Close()

	var result BrainResponse

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode brain response: %w", err)
	}

	return &result, nil
}
