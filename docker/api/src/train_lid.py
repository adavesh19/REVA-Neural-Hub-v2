import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
import os

# Dataset Construction
data = [
    # English (en)
    ("Hello how are you", "en"), ("The weather is nice", "en"), ("I love programming", "en"),
    ("MOM", "en"), ("Mother", "en"), ("What is your name", "en"), ("Good morning", "en"),
    ("The quick brown fox", "en"), ("Artificial intelligence", "en"), ("Engineering student", "en"),
    
    # Hindi (hi)
    ("नमस्ते आप कैसे हैं", "hi"), ("आपका नाम क्या है", "hi"), ("मुझे भारत पसंद है", "hi"),
    ("namaste", "hi"), ("kaise ho", "hi"), ("shukriya", "hi"), ("mera naam", "hi"),
    ("dhanyavad", "hi"), ("khaana khaaya", "hi"), ("hindustaan", "hi"),
    
    # Kannada (kn) - High priority for 'amma' and 'namaskara'
    ("ನಮಸ್ಕಾರ ನೀವು ಹೇಗಿದ್ದೀರಿ", "kn"), ("ನಿಮ್ಮ ಹೆಸರೇನು", "kn"), ("ನನಗೆ ಕನ್ನಡ ಇಷ್ಟ", "kn"),
    ("AMMA", "kn"), ("amma", "kn"), ("namaskara", "kn"), ("hegidira", "kn"), 
    ("ಊಟ ಆಯ್ತಾ", "kn"), ("banni", "kn"), ("kannada kalithu", "kn"), ("ella kshema na", "kn"),
    ("bhoomi", "kn"), ("shatamanotsava", "kn"), ("vidyarthi", "kn"), ("yellaru hegiddira", "kn"),
    ("kannada nudi", "kn"), ("namaskara bandhu", "kn"),
    
    # Tamil (ta)
    ("வணக்கம் நீங்கள் எப்படி இருக்கிறீர்கள்", "ta"), ("உங்களது பெயர் என்ன", "ta"),
    ("vanakkam", "ta"), ("eppadi irukkinga", "ta"), ("nandri", "ta"),
    ("un peyar enna", "ta"), ("saaptaacha", "ta"), ("romba nandri", "ta"),
    
    # Telugu (te)
    ("నమస్కారం మీరు ఎలా ఉన్నారు", "te"), ("మీ పేరు ఏమిటి", "te"),
    ("namaskaram", "te"), ("ela unnav", "te"), ("dhanyavadalu", "te"),
    ("nee peru emiti", "te"), ("annum thinnava", "te"), ("bagunnara", "te"),
    
    # Malayalam (ml)
    ("നമസ്കാരം സുഖമാണോ", "ml"), ("നിങ്ങളുടെ പേര് എന്താണ്", "ml"),
    ("namaskaram", "ml"), ("sukhamano", "ml"), ("nanni", "ml"),
    ("perentha", "ml"), ("ennu varum", "ml"), ("sughamaanu", "ml"),
    
    # French (fr)
    ("Bonjour comment allez-vous", "fr"), ("Quel est votre nom", "fr"), ("J'aime le café", "fr"),
    ("merci", "fr"), ("il fait beau", "fr"), ("la vie est belle", "fr"),
    
    # Spanish (es)
    ("Hola cómo estás", "es"), ("Cuál es tu nombre", "es"), ("Me gusta viajar", "es"),
    ("gracias", "es"), ("buenos días", "es"), ("estoy bien", "es"),
    
    # German (de)
    ("Guten Tag wie geht es dir", "de"), ("Wie heißt du", "de"), ("Ich liebe Musik", "de"),
    ("danke", "de"), ("alles gut", "de"), ("schön dich zu sehen", "de")
]

# Increase data volume by repeating patterns for stability
data = data * 50

df = pd.DataFrame(data, columns=['text', 'lang'])

# Vectorization: Character 2-4 grams
print("Starting Vectorization...")
vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 4))
X = vectorizer.fit_transform(df['text'])
y = df['lang']

# Training
print("Training MultinomialNB...")
model = MultinomialNB()
model.fit(X, y)

# Saving
os.makedirs('models', exist_ok=True)
joblib.dump(model, 'lid_model.pkl')
joblib.dump(vectorizer, 'lid_vectorizer.pkl')

print("Model and Vectorizer saved successfully!")

# Quick verification
test_texts = ["MOM", "AMMA", "namaste", "Bonjour", "Hegidira"]
for t in test_texts:
    vec = vectorizer.transform([t])
    pred = model.predict(vec)[0]
    print(f"'{t}' -> {pred}")
