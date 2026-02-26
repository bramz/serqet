package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	// "net/url"
)

const KrakenBaseURL = "https://api.kraken.com"

func GetKrakenSignature(path string, values url.Values, secret string) (string, error) {
	sha := sha256.New()
	sha.Write([]byte(values.Get("nonce") + values.Encode()))
	shasum := sha.Sum(nil)

	secretBytes, _ := base64.StdEncoding.DecodeString(secret)
	mac := hmac.New(sha512.New, secretBytes)
	mac.Write(append([]byte(path), shasum...))
	
	return base64.StdEncoding.EncodeToString(mac.Sum(nil)), nil
}

func FetchKrakenBalance() (map[string]string, error) {
	apiKey := os.Getenv("KRAKEN_API_KEY")
	apiSecret := os.Getenv("KRAKEN_SECRET_KEY")
	path := "/0/private/Balance"

	// 1. Create Nonce
	nonce := strconv.FormatInt(time.Now().UnixNano(), 10)
	values := url.Values{}
	values.Set("nonce", nonce)

	// 2. Generate Signature (from previous logic)
	signature, err := GetKrakenSignature(path, values, apiSecret)
	if err != nil {
		return nil, err
	}

	// 3. Prepare Request
	req, _ := http.NewRequest("POST", KrakenBaseURL+path, nil)
	req.Header.Set("API-Key", apiKey)
	req.Header.Set("API-Sign", signature)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
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
	json.Unmarshal(body, &result)

	if len(result.Error) > 0 {
		return nil, fmt.Errorf("Kraken API Error: %v", result.Error)
	}

	return result.Result, nil
}