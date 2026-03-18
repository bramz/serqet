package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"gateway/utils"
)

type Candle struct {
	Time   int64   `json:"time"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume float64 `json:"volume"`
}

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

func FetchOHLC(pair string) (interface{}, error) {
	// urlPath := fmt.Sprintf("/0/public/OHLC?pair=%s&interval=60", pair)
	// resp, err := http.Get(KrakenBaseURL + urlPath)
	resp, err := http.Get(fmt.Sprintf("https://api.kraken.com/0/public/OHLC?pair=%s&interval=60", pair))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Result map[string]interface{} `json:"result"`
		Error  []string               `json:"error"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	
	if len(result.Error) > 0 {
		return nil, fmt.Errorf("kraken error: %v", result.Error)
	}

	return result.Result, nil
}

func FetchMarketCandles(pair string) ([]Candle, error) {
	// interval=60 is 1-hour candles.
	// url := fmt.Sprintf("%s/0/public/OHLC?pair=%s&interval=60", KrakenBaseURL, pair)
	url := fmt.Sprintf("https://api.kraken.com/0/public/OHLC?pair=%s&interval=60", pair)
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		Result map[string]interface{} `json:"result"`
		Error  []string               `json:"error"`
	}
	json.NewDecoder(resp.Body).Decode(&raw)

	if len(raw.Error) > 0 {
		return nil, fmt.Errorf("kraken error: %v", raw.Error)
	}

	// Kraken returns the pair name as the key (e.g., "XXBTZUSD") iterate to find the slice of data
	var candles []Candle
	for k, v := range raw.Result {
		if k == "last" { continue }
		
		rawSlice := v.([]interface{})
		for _, item := range rawSlice {
			c := item.([]interface{})
			log.Printf("Raw candle data: %v", c)
			// Kraken OHLC Format: [time, open, high, low, close, vwap, volume, count]
			candles = append(candles, Candle{
				Time:  int64(utils.ParseNumeric(c[0])),
				Open:  utils.ParseNumeric(c[1]),
				High:  utils.ParseNumeric(c[2]),
				Low:   utils.ParseNumeric(c[3]),
				Close: utils.ParseNumeric(c[4]),
				Volume: utils.ParseNumeric(c[6]),
			})
		}
	}

	return candles, nil
}