package utils

import (
	"fmt"
	"strconv"
	"log"
)


func SafeString(data map[string]interface{}, key string) string {
	val, ok := data[key]
	if !ok || val == nil {
		return ""
	}
	return fmt.Sprintf("%v", val)
}

func ParseNumeric(val interface{}) float64 {
	switch v := val.(type) {
	case float64:
		return v
	case string:
		f, err := strconv.ParseFloat(v, 64)
		if err != nil {
			log.Printf("Error parsing numeric string: %v", err)
			return 0
		}
		return f
	default:
		log.Printf("Unexpected type for numeric value: %T", val)
		return 0
	}
}
