from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

app = FastAPI()

MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

# Labels from model
LABELS = list(model.config.id2label.values())

class EmotionRequest(BaseModel):
    text: str

@app.get("/")
def root():
    return {"status": "Emotion service running ✅"}

@app.post("/api/emotion/analyze")
def analyze_emotion(payload: EmotionRequest):
    text = payload.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=256,
        )

        with torch.no_grad():
            outputs = model(**inputs)

        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        scores = {LABELS[i].capitalize(): float(probs[i]) for i in range(len(LABELS))}

        # Top label
        top_idx = int(torch.argmax(probs).item())
        label = LABELS[top_idx].capitalize()

        return {
            "label": label,
            "scores": scores,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")
