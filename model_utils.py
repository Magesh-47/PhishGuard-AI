import re
import math
import tldextract
from urllib.parse import urlparse
import joblib
import numpy as np
import warnings
warnings.filterwarnings('ignore')

class PhishingDetector:
    def __init__(self, model_path='models/phishing_model.pkl', 
                 scaler_path='models/scaler.pkl',
                 features_path='models/feature_columns.pkl'):
        """Initialize the phishing detector with trained models"""
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_columns = joblib.load(features_path)
            self.is_loaded = True
            print("Models loaded successfully!")
        except Exception as e:
            print(f"Error loading models: {e}")
            self.is_loaded = False
    
    def extract_features(self, url):
        """Extract features from a URL"""
        features = {}
        
        try:
            # Parse URL
            parsed = urlparse(url)
            extracted = tldextract.extract(url)
            
            # Basic URL features
            features['url_length'] = len(url)
            
            # Domain features
            features['domain_length'] = len(extracted.domain)
            features['subdomain_length'] = len(extracted.subdomain)
            features['has_subdomain'] = int(extracted.subdomain != '')
            features['subdomain_count'] = len(extracted.subdomain.split('.')) if extracted.subdomain else 0
            
            # Token count
            features['token_count'] = len(url.split('/'))
            features['path_token_count'] = len(parsed.path.split('/')) if parsed.path else 0
            
            # Special characters
            features['dot_count'] = url.count('.')
            features['hyphen_count'] = url.count('-')
            features['underscore_count'] = url.count('_')
            features['slash_count'] = url.count('/')
            features['question_count'] = url.count('?')
            features['equal_count'] = url.count('=')
            features['at_count'] = url.count('@')
            features['amp_count'] = url.count('&')
            features['hash_count'] = url.count('#')
            features['percent_count'] = url.count('%')
            
            # Digit analysis
            features['digit_count'] = sum(c.isdigit() for c in url)
            features['digit_ratio'] = features['digit_count'] / len(url) if len(url) > 0 else 0
            
            # Suspicious patterns
            features['has_ip'] = int(self.contains_ip(url))
            features['is_shortened'] = int(self.is_shortened_url(url))
            features['suspicious_tld'] = int(extracted.suffix in ['.xyz', '.top', '.club', '.online', '.site', '.web'])
            
            # HTTPS check
            features['uses_https'] = int(parsed.scheme == 'https')
            
            # Port presence
            features['has_port'] = int(':' in parsed.netloc and not parsed.netloc.endswith(':'))
            
            # URL entropy
            features['url_entropy'] = self.calculate_entropy(url)
            
            # Phishing keywords
            phishing_keywords = ['secure', 'login', 'signin', 'verify', 'account', 'update',
                               'confirm', 'banking', 'paypal', 'apple', 'icloud', 'password',
                               'credential', 'authenticate', 'validation', 'security']
            features['phishing_keyword_count'] = sum(1 for keyword in phishing_keywords if keyword in url.lower())
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            # Return default values if feature extraction fails
            features = {col: 0 for col in self.feature_columns}
        
        return features
    
    def contains_ip(self, url):
        """Check if URL contains IP address"""
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        return bool(re.search(ip_pattern, url))
    
    def is_shortened_url(self, url):
        """Check if URL is shortened"""
        shortening_services = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'tiny.cc']
        return any(service in url.lower() for service in shortening_services)
    
    def calculate_entropy(self, url):
        """Calculate Shannon entropy of URL"""
        prob = [float(url.count(c)) / len(url) for c in dict.fromkeys(list(url))]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob if p > 0])
        return entropy
    
    def predict(self, url):
        """Predict if URL is phishing or legitimate"""
        if not self.is_loaded:
            return {
                'url': url,
                'is_phishing': None,
                'confidence': 0,
                'risk_level': 'ERROR',
                'risk_score': 0,
                'features': {},
                'error': 'Model not loaded'
            }
        
        try:
            # Extract features
            features = self.extract_features(url)
            
            # Create feature vector in correct order
            feature_vector = []
            for col in self.feature_columns:
                feature_vector.append(features.get(col, 0))
            
            # Scale features
            feature_vector_scaled = self.scaler.transform([feature_vector])
            
            # Make prediction
            prediction_proba = self.model.predict_proba(feature_vector_scaled)[0]
            
            # Get results
            is_phishing = bool(prediction_proba[1] > 0.5)
            confidence = prediction_proba[1] if is_phishing else prediction_proba[0]
            
            # Calculate risk score (0-100)
            risk_score = prediction_proba[1] * 100
            
            # Determine risk level
            if risk_score < 30:
                risk_level = 'LOW'
            elif risk_score < 60:
                risk_level = 'MEDIUM'
            elif risk_score < 80:
                risk_level = 'HIGH'
            else:
                risk_level = 'CRITICAL'
            
            return {
                'url': url,
                'is_phishing': is_phishing,
                'confidence': float(confidence),
                'risk_level': risk_level,
                'risk_score': float(risk_score),
                'features': features,
                'error': None
            }
            
        except Exception as e:
            return {
                'url': url,
                'is_phishing': None,
                'confidence': 0,
                'risk_level': 'ERROR',
                'risk_score': 0,
                'features': {},
                'error': str(e)
            }
    
    def analyze_url(self, url):
        """Provide detailed analysis of URL"""
        result = self.predict(url)
        
        if result['error']:
            return result
        
        # Add detailed analysis
        result['analysis'] = {
            'suspicious_patterns': [],
            'recommendations': []
        }
        
        # Analyze specific features
        features = result['features']
        
        if features.get('has_ip', 0):
            result['analysis']['suspicious_patterns'].append('URL contains IP address instead of domain name')
        
        if features.get('is_shortened', 0):
            result['analysis']['suspicious_patterns'].append('URL uses a URL shortening service')
        
        if features.get('suspicious_tld', 0):
            result['analysis']['suspicious_patterns'].append('URL uses suspicious top-level domain')
        
        if features.get('phishing_keyword_count', 0) > 2:
            result['analysis']['suspicious_patterns'].append('URL contains multiple phishing-related keywords')
        
        if features.get('url_length', 0) > 100:
            result['analysis']['suspicious_patterns'].append('URL is unusually long')
        
        if features.get('digit_ratio', 0) > 0.3:
            result['analysis']['suspicious_patterns'].append('URL has high digit-to-character ratio')
        
        if not features.get('uses_https', 1):
            result['analysis']['suspicious_patterns'].append('URL does not use HTTPS encryption')
        
        # Generate recommendations
        if result['risk_level'] in ['HIGH', 'CRITICAL']:
            result['analysis']['recommendations'].append('Do not visit this website')
            result['analysis']['recommendations'].append('Do not enter any personal information')
        elif result['risk_level'] == 'MEDIUM':
            result['analysis']['recommendations'].append('Exercise caution when visiting this site')
            result['analysis']['recommendations'].append('Verify the website legitimacy through other means')
        else:
            result['analysis']['recommendations'].append('Site appears safe, but always stay vigilant')
        
        result['analysis']['recommendations'].append('Keep your browser and security software updated')
        result['analysis']['recommendations'].append('Enable two-factor authentication where possible')
        
        return result

# Singleton instance
detector = PhishingDetector()