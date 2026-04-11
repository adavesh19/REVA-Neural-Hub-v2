from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Union, List
import langid
import time
import traceback
import requests
from deep_translator import GoogleTranslator, MyMemoryTranslator
from langdetect import detect as lang_detect
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

    # TIER 2: Official Google Detection API (The Gold Standard)
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q={requests.utils.quote(text)}"
        r = requests.get(url, timeout=3)
        if r.status_code == 200:
            detected = r.json()[2]
            print(f"LID [Tier 2 - Google API]: '{text}' -> {detected}")
            return detected
    except Exception as e:
        print(f"LID Tier 2 (Google API) Error: {e}")

    # TIER 3: Langid (Robust Backup)
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

def translate_free(text: str, target_lang: str, source_lang: str):
    """Attempt free translation using available scrapers/APIs"""
    # 1. First choice: Google Search Scraper (Fastest)
    try:
        return GoogleTranslator(source=source_lang, target=target_lang).translate(text), "Google-Free"
    except Exception as e:
        print(f"Google Free failed: {e}")
    
    # 2. Second choice: MyMemory API (Reliable fallback)
    try:
        return MyMemoryTranslator(source=source_lang, target=target_lang).translate(text), "MyMemory-Free"
    except Exception as e:
        print(f"MyMemory failed: {e}")
        
    raise ValueError("All free translation engines are currently unavailable.")

@app.get("/translate")
async def translate(text: str, target_lang: str, source_lang: Optional[str] = "auto"):
    start_time = time.time()
    try:
        src = source_lang
        detected = src
        
        if src == "auto":
            detected = detect_language_custom(text)
            src = detected
            
        # Use Free Engine
        translated, engine = translate_free(text, target_lang, src)
        
        return {
            "target_lang": target_lang,
            "source_lang": detected,
            "translated": [translated],
            "engine": engine,
            "translation_time": time.time() - start_time
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(400, detail="Error: " + str(e))

@app.post("/translate")
async def translate_post(request: TranslationRequest):
    start_time = time.time()
    try:
        src = request.source_lang
        detected = src
        
        if src == "auto":
            if isinstance(request.text, list):
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
        raise HTTPException(400, detail="Error: " + str(e))

@app.get("/language_detection")
async def language_detection(text: str):
    return detect_language_custom(text)

@app.get("/get_languages")
async def get_languages():
    return ["en", "hi", "kn", "ta", "te", "ml", "gu", "pa"]

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "api_mode": "free",
        "engines": ["Google-Free", "MyMemory"],
        "model": "Neural Hub v3 (Free Edition)"
    }

@app.get("/model_name")
async def model_name():
    return "Neural Hub v3 Custom Engine"