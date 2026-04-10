from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Union, List
import time
import os
import traceback
import joblib
from deep_translator import GoogleTranslator
from langdetect import detect as lang_detect

app = FastAPI()

# Load custom LID model
try:
    LID_MODEL = joblib.load('lid_model.pkl')
    LID_VECTORIZER = joblib.load('lid_vectorizer.pkl')
    print("Custom LID model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load custom LID model: {e}")
    LID_MODEL = None
    LID_VECTORIZER = None

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

def detect_language_custom(text: str):
    if LID_MODEL and LID_VECTORIZER:
        try:
            # Predict using lowercase to match training
            vec = LID_VECTORIZER.transform([text.lower()])
            prediction = LID_MODEL.predict(vec)[0]
            return prediction
        except Exception as e:
            print(f"LID prediction error: {e}")
    
    # Fallback to legacy langdetect
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