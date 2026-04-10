import joblib
import os

# Load the model and vectorizer
try:
    LID_MODEL = joblib.load('lid_model.pkl')
    LID_VECTORIZER = joblib.load('lid_vectorizer.pkl')
    print("Model loaded.")
except Exception as e:
    print(f"Error loading model: {e}")
    exit(1)

def detect_language_custom(text: str):
    vec = LID_VECTORIZER.transform([text])
    prediction = LID_MODEL.predict(vec)[0]
    return prediction

# Test cases
tests = [
    ("MOM", "en"),
    ("AMMA", "kn"),
    ("Hello how are you", "en"),
    ("namaste", "hi"),
    ("namaskara", "kn"),
    ("banni", "kn"),
    ("Bonjour", "fr"),
    ("Hola", "es"),
    ("Guten Tag", "de")
]

all_passed = True
for text, expected in tests:
    result = detect_language_custom(text)
    print(f"Testing '{text}': Expected {expected}, got {result}")
    if result != expected:
        all_passed = False
        print(f"FAILED: '{text}'")

if all_passed:
    print("\nALL TESTS PASSED!")
else:
    print("\nSOME TESTS FAILED.")
