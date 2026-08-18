import pandas as pd
import numpy as np
from urllib.parse import urlparse
import tldextract
import random
from datetime import datetime, timedelta

class PhishingDatasetGenerator:
    def __init__(self, n_samples=10000):
        self.n_samples = n_samples
        np.random.seed(42)
        random.seed(42)
        
        # Common legitimate domains
        self.legitimate_domains = [
            'google.com', 'microsoft.com', 'amazon.com', 'facebook.com', 
            'twitter.com', 'linkedin.com', 'github.com', 'stackoverflow.com',
            'wikipedia.org', 'youtube.com', 'netflix.com', 'spotify.com',
            'dropbox.com', 'drive.google.com', 'docs.google.com'
        ]
        
        # Common phishing keywords
        self.phishing_keywords = [
            'secure', 'login', 'signin', 'verify', 'account', 'update',
            'confirm', 'banking', 'paypal', 'apple', 'icloud', 'password',
            'credential', 'authenticate', 'validation', 'security'
        ]
        
        # Suspicious TLDs
        self.suspicious_tlds = ['.xyz', '.top', '.club', '.online', '.site', '.web']
        
    def extract_features_from_url(self, url):
        """Extract features from a single URL"""
        features = {}
        
        # Parse URL
        parsed = urlparse(url)
        extracted = tldextract.extract(url)
        
        # URL length
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
        features['suspicious_tld'] = int(any(extracted.suffix.endswith(tld) for tld in self.suspicious_tlds))
        
        # HTTPS check
        features['uses_https'] = int(parsed.scheme == 'https')
        
        # Port presence
        features['has_port'] = int(':' in parsed.netloc and not parsed.netloc.endswith(':'))
        
        # URL entropy (randomness)
        features['url_entropy'] = self.calculate_entropy(url)
        
        # Phishing keywords
        features['phishing_keyword_count'] = sum(1 for keyword in self.phishing_keywords if keyword in url.lower())
        
        return features
    
    def contains_ip(self, url):
        """Check if URL contains IP address"""
        import re
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        return bool(re.search(ip_pattern, url))
    
    def is_shortened_url(self, url):
        """Check if URL is shortened"""
        shortening_services = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'tiny.cc']
        return any(service in url.lower() for service in shortening_services)
    
    def calculate_entropy(self, url):
        """Calculate Shannon entropy of URL"""
        import math
        prob = [float(url.count(c)) / len(url) for c in dict.fromkeys(list(url))]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
        return entropy
    
    def generate_legitimate_url(self):
        """Generate legitimate URL"""
        domain = random.choice(self.legitimate_domains)
        paths = ['home', 'about', 'products', 'services', 'contact', 'blog', 
                 'docs', 'support', 'help', 'faq', 'terms', 'privacy']
        
        if random.random() < 0.3:
            # Add subdomain
            subdomains = ['www', 'mail', 'blog', 'shop', 'support', 'api']
            domain = f"{random.choice(subdomains)}.{domain}"
        
        path = random.choice(paths)
        if random.random() < 0.5:
            path = f"{path}/{random.randint(100, 999)}"
        
        protocol = 'https' if random.random() < 0.95 else 'http'
        url = f"{protocol}://{domain}/{path}"
        
        if random.random() < 0.2:
            url += f"?{random.choice(['id', 'page', 'ref'])}={random.randint(1000, 9999)}"
        
        return url
    
    def generate_phishing_url(self):
        """Generate phishing URL"""
        legitimate_target = random.choice(self.legitimate_domains).split('.')[0]
        
        # Method 1: Typosquatting
        if random.random() < 0.3:
            pos = random.randint(1, len(legitimate_target)-1)
            domain = legitimate_target[:pos] + legitimate_target[pos+1:]
        # Method 2: Additional words
        elif random.random() < 0.3:
            domain = f"{legitimate_target}-{random.choice(self.phishing_keywords)}"
        # Method 3: Different TLD
        else:
            domain = legitimate_target
        
        tld = random.choice(self.suspicious_tlds) if random.random() < 0.5 else random.choice(['.com', '.org', '.net'])
        
        # Use suspicious subdomain
        subdomain = random.choice(['secure', 'login', 'account', 'verify', 'update'])
        
        # Path with phishing keywords
        path = '/'.join(random.sample(self.phishing_keywords, random.randint(1, 3)))
        
        protocol = 'http' if random.random() < 0.7 else 'https'
        url = f"{protocol}://{subdomain}.{domain}{tld}/{path}"
        
        # Add query parameters
        if random.random() < 0.7:
            params = [f"{random.choice(['id', 'user', 'account', 'token'])}={random.randint(1000, 9999)}"
                     for _ in range(random.randint(1, 3))]
            url += "?" + "&".join(params)
        
        return url
    
    def generate_dataset(self):
        """Generate complete dataset"""
        data = []
        
        for i in range(self.n_samples):
            if i < self.n_samples // 2:
                url = self.generate_legitimate_url()
                label = 0  # Legitimate
            else:
                url = self.generate_phishing_url()
                label = 1  # Phishing
            
            features = self.extract_features_from_url(url)
            features['url'] = url
            features['label'] = label
            data.append(features)
        
        df = pd.DataFrame(data)
        random.shuffle(self.legitimate_domains)  # Shuffle for randomness
        return df

def main():
    print("Generating phishing detection dataset...")
    generator = PhishingDatasetGenerator(n_samples=10000)
    df = generator.generate_dataset()
    
    # Save to CSV
    df.to_csv('data/phishing_dataset.csv', index=False)
    print(f"Dataset generated with {len(df)} samples")
    print(f"Features: {df.columns.tolist()}")
    print(f"Class distribution:\n{df['label'].value_counts()}")
    print("\nSample URLs:")
    print(df[['url', 'label']].head(10))

if __name__ == "__main__":
    import os
    os.makedirs('data', exist_ok=True)
    main()