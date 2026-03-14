from pathlib import Path

import pandas as pd
import pytesseract
import spacy
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from pdf2image import convert_from_path

from .consistency import extract_structured_fields


class OCRService:
    def __init__(self) -> None:
        self.nlp = spacy.blank("en")

    def preprocess_image(self, image: Image.Image) -> list[Image.Image]:
        # Generate a few OCR-friendly variants because ID cards are often low-contrast photos.
        base = ImageOps.exif_transpose(image).convert("L")
        enlarged = base.resize((base.width * 2, base.height * 2))
        contrasted = ImageEnhance.Contrast(enlarged).enhance(2.0)
        sharpened = contrasted.filter(ImageFilter.SHARPEN)
        thresholded = sharpened.point(lambda pixel: 255 if pixel > 160 else 0)
        autocontrasted = ImageOps.autocontrast(sharpened)
        return [base, enlarged, sharpened, autocontrasted, thresholded]

    def extract_best_text(self, image: Image.Image) -> str:
        candidates: list[str] = []
        configs = [
            "--psm 6",
            "--psm 11",
            "--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/ ",
        ]

        for variant in self.preprocess_image(image):
            for config in configs:
                text = pytesseract.image_to_string(variant, config=config).strip()
                if text:
                    candidates.append(text)

        if not candidates:
            return ""

        def score(text: str) -> tuple[int, int]:
            alnum_count = sum(char.isalnum() for char in text)
            digit_count = sum(char.isdigit() for char in text)
            return (alnum_count + digit_count * 2, len(text))

        return max(candidates, key=score)

    def read_file(self, file_path: str) -> str:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if path.suffix.lower() == ".pdf":
            pages = convert_from_path(path, dpi=300)
            text = "\n".join(self.extract_best_text(page) for page in pages)
        else:
            text = self.extract_best_text(Image.open(path))
        return text.strip()

    def extract(self, file_path: str) -> dict:
        text = self.read_file(file_path)
        doc = self.nlp(text)
        extracted = extract_structured_fields(text)
        entities = pd.Series(extracted).dropna().to_dict() if extracted else {}
        entities["token_count"] = len(doc)
        return {"extracted_text": text, "entities": entities}


ocr_service = OCRService()
