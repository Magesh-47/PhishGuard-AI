import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'phishing-detection-secret-key-2024'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///phishing_detection.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Model configurations
    MODEL_PATH = 'models/phishing_model.pkl'
    SCALER_PATH = 'models/scaler.pkl'
    FEATURES_PATH = 'models/feature_columns.pkl'
    
    # Feature extraction settings
    URL_TIMEOUT = 5
    MAX_URL_LENGTH = 512
    
    # Security settings
    BCRYPT_LOG_ROUNDS = 13
    REMEMBER_COOKIE_DURATION = 3600 * 24 * 30  # 30 days