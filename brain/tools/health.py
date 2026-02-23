from langchain_core.tools import tool

@tool
def record_meal(food_item: str, calories: int = 0, protein: float = 0, carbs: float = 0, fats: float = 0):
    """
    Records a meal or food intake.
    Call this when the user mentions diet. Such as eating, tracking calories, or macros.
    """
    return {
        "action": "db_record_meal",
        "food_item": food_item,
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fats": fats
    }

@tool
def record_workout(exercise: str, sets: int = 0, reps: int = 0, weight: float = 0, duration_mins: int = 0):
    """
    Records a physical workout or exercise.
    Call this when the user mentions lifting weights, running, or going to the gym.
    """
    return {
        "action": "db_record_workout",
        "exercise": exercise,
        "sets": sets,
        "reps": reps,
        "weight": weight,
        "duration": duration_mins
    }