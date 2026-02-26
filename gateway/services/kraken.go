package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

func getKrakenSignature(urlPath string, values url.Values, secret string) (string, error) {
	sha := sha256.New()
	sha.Write([]byte(values.Get("nonce") + values.Encode()))
	shasum := sha.Sum(nil)

	secretBytes, err := base64.StdEncoding.DecodeString(secret)
	if err != nil {
		return "", err
	}

	mac := hmac.New(sha512.New, secretBytes)
	mac.Write(append([]byte(urlPath), shasum...))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil)), nil
}

func FetchKrakenBalances() (map[string]string, error) {
	apiKey := os.Getenv("KRAKEN_API_KEY")
	secret := os.Getenv("KRAKEN_SECRET_KEY")
	urlPath := "/0/private/Balance"

	// Kraken needs nonce in the POST body
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())
	values := url.Values{}
	values.Set("nonce", nonce)

	sig, err := getKrakenSignature(urlPath, values, secret)
	if err != nil {
		return nil, fmt.Errorf("Signature error: %v", err)
	}

	req, err := http.NewRequest("POST", "https://api.kraken.com"+urlPath, strings.NewReader(values.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("API-Key", apiKey)
	req.Header.Set("API-Sign", sig)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Result map[string]string `json:"result"`
		Error  []string          `json:"error"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("Decode error: %v", err)
	}

	if len(result.Error) > 0 {
		return nil, fmt.Errorf("Kraken API Error: %v", result.Error)
	}

	return result.Result, nil
}