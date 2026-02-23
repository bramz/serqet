package models

type DietRecord struct {
	Base
	FoodItem string  `json:"food_item"`
	Calories int     `json:"calories"`
	Protein  int     `json:"protein"`
	Carbs    int     `json:"carbs"`
	Fats     int     `json:"fats"`
}

type WorkoutRecord struct {
	Base
	Exercise     string  `json:"exercise"`
	Sets         int     `json:"sets"`
	Reps         int     `json:"reps"`
	Weight       int     `json:"weight"`
	DurationMins int     `json:"duration"`
}