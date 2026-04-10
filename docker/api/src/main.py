from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Union, List
import joblib
import langid
import time
import traceback
from googletrans import Translator
from deep_translator import GoogleTranslator
from langdetect import detect as lang_detect

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: Union[str, List[str]]
    target_lang: str
    source_lang: Optional[str] = "auto"

translator_api = Translator()

# TIER 1: Expert Priority Dictionary (100% Accuracy for common keywords)
PRIORITY_DICT = {
    "amma": "kn",
    "mom": "en",
    "mother": "en",
    "father": "en",
    "dad": "en",
    "appaji": "kn",
    "thande": "kn",
    "thayi": "kn",
    "namaste": "hi",
    "namaskara": "kn",
    "vanakkam": "ta",
    "namaskaram": "te",
    "hello": "en",
    "shukriya": "hi",
    "dhanyavad": "hi"
}

def detect_language_custom(text: str):
    clean_text = text.lower().strip()
    
    # --- TIER 1: Match Priority Dictionary ---
    if clean_text in PRIORITY_DICT:
        detected = PRIORITY_DICT[clean_text]
        print(f"LID [Tier 1 - Dictionary]: '{text}' -> {detected}")
        return detected

    # --- TIER 2: Google Translate API (The Truth) ---
    try:
        detection = translator_api.detect(text)
        detected = detection.lang
        if isinstance(detected, list): detected = detected[0]
        print(f"LID [Tier 2 - Google API]: '{text}' -> {detected}")
        return detected
    except Exception as e:
        print(f"LID Tier 2 Error: {e}")

    # --- TIER 3: Langid (Robust Offline) ---
    try:
        detected, confidence = langid.classify(text)
        print(f"LID [Tier 3 - Langid]: '{text}' -> {detected}")
        return detected
    except Exception as e:
        print(f"LID Tier 3 Error: {e}")

    # Final Fallback
    try:
        return lang_detect(text)
    except:
        return "unknown"

@app.get("/translate")
async def translate(text: str, target_lang: str, source_lang: Optional[str] = "auto"):
    start_time = time.time()
    try:
        src = source_lang
        detected = src
        
        if src == "auto":
            detected = detect_language_custom(text)
            src = detected
            
        translated = GoogleTranslator(source=src, target=target_lang).translate(text)
        
        return {
            "target_lang": target_lang,
            "source_lang": detected,
            "translated": [translated],
            "translation_time": time.time() - start_time
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(403, detail="Error: " + str(e))

@app.post("/translate")
async def translate_post(request: TranslationRequest):
    start_time = time.time()
    try:
        src = request.source_lang
        detected = src
        
        if src == "auto":
            if isinstance(request.text, list):
                # Using the first element for detection if auto
                detected = detect_language_custom(request.text[0]) if request.text else "en"
            else:
                detected = detect_language_custom(request.text)
            src = detected
            
        if isinstance(request.text, list):
            translated = [GoogleTranslator(source=src, target=request.target_lang).translate(t) for t in request.text]
        else:
            translated = [GoogleTranslator(source=src, target=request.target_lang).translate(request.text)]
            
        return {
            "target_lang": request.target_lang,
            "source_lang": detected,
            "translated": translated,
            "translation_time": time.time() - start_time
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(403, detail="Error: " + str(e))

@app.get("/language_detection")
async def language_detection(text: str):
    return detect_language_custom(text)

@app.get("/get_languages")
async def get_languages():
    return ["en", "hi", "kn", "ta", "te", "ml", "gu", "pa"]

@app.get("/model_name")
async def model_name():
    return "Neural Hub Custom LID (High Accuracy)"