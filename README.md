# NagarikAI

Production-ready prototype for CSC operators to validate government applications before submission.

## Stack

- Frontend: React, TailwindCSS, Axios
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- AI/ML: scikit-learn, spaCy, pandas
- OCR: Tesseract OCR

## Structure

- `frontend/` React dashboard and AI validation UI
- `backend/` FastAPI app, rule engine, OCR, ML predictor
- `ml_models/` trained model artifacts
- `ocr/` OCR integration notes
- `database/` PostgreSQL schema

## Run

1. Start PostgreSQL:
   `docker compose up -d postgres`
2. Install backend dependencies:
   `pip install -r requirements.txt`
3. Start API:
   `uvicorn backend.app.main:app --reload`
4. Install frontend dependencies:
   `npm install --prefix frontend`
5. Start frontend:
   `npm run frontend:dev`

## Deploy

### Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-render-backend>.onrender.com`

### Backend on Render

- Use a Docker web service with `backend/Dockerfile`
- Service root directory: `backend`
- Health check path: `/health`
- Environment variable: `DATABASE_URL=<Render PostgreSQL connection string>`
- Optional environment variables:
  - `OPENAI_API_KEY`
  - `OPENAI_RISK_MODEL`

`render.yaml` is included for Blueprint-based setup. Note that uploaded files are stored on the container filesystem, which is ephemeral unless you add persistent storage.

## Optional LLM Risk Assessment

- Set `OPENAI_API_KEY` to enable LLM-backed risk scoring in `/validate-checklist`.
- Optional: set `OPENAI_RISK_MODEL` to override the default model (`gpt-4o-mini`).
- Without an API key, the app falls back to the local rule-based risk engine.

## Notes

- Tesseract OCR must be installed on the host and available in `PATH`.
- The backend seeds demo applications for Sand Mining, Brick Kiln, and Infrastructure Project on startup.
