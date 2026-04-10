from transformers import MarianTokenizer
from easynmt import EasyNMT
import sys

try:
    model_name = 'Helsinki-NLP/opus-mt-de-en'
    print(f"Attempting to load tokenizer for {model_name}...")
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    print("Successfully loaded tokenizer!")
except Exception as e:
    print(f"Failed to load tokenizer: {e}")
    sys.exit(1)
