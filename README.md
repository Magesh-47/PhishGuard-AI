# Phishing Detection System

A Flask web application that analyzes URLs and predicts whether they are phishing or legitimate, using a machine learning model trained on URL-based features.

## Features

- URL analysis via a web form or JSON API, with a risk score, risk level (LOW/MEDIUM/HIGH/CRITICAL), and a list of suspicious patterns detected (IP-based URL, URL shorteners, suspicious TLDs, phishing keywords, etc.)
- User accounts (register/login) with per-user check history and dashboard statistics
- REST endpoints for checking a URL and fetching user stats programmatically

## Tech Stack

- **Backend**: Flask, Flask-SQLAlchemy, Flask-Login
- **ML**: scikit-learn (Random Forest, Gradient Boosting, Neural Network, SVM combined into a voting ensemble), joblib for model persistence
- **Feature extraction**: tldextract, URL structure/entropy/keyword heuristics
- **Database**: SQLite

## Project Structure

```
app.py              Flask app, routes, database models
config.py           App configuration
model_utils.py       PhishingDetector: loads the trained model and scores URLs
train_model.py       Trains and saves the ML model, scaler, and feature columns
generate_data.py     Generates the training dataset
models/               Saved model, scaler, and feature columns (.pkl)
data/                 Training dataset (CSV)
templates/            Jinja2 templates
static/               CSS/JS/static assets
```

## Setup

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. (Optional) Regenerate the dataset and retrain the model:
   ```
   python generate_data.py
   python train_model.py
   ```
   Pretrained model files are already included under `models/`.
4. Run the app:
   ```
   python app.py
   ```
   The app starts at `http://127.0.0.1:5000`.

## API

- `POST /api/check-url` — body `{"url": "...", "save_result": false}`, returns the prediction result as JSON.
- `GET /api/stats/<user_id>` — returns check statistics for a logged-in user over a given number of days (`?days=30`).

## Notes

- `SECRET_KEY` and the database URI are set in `config.py` / `app.py` — replace the placeholder secret key before deploying.
- `train_model.py` and `generate_data.py` require `pandas`, which is only needed for training, not for running the web app.
