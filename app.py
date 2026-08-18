from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import os
from model_utils import detector
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here-change-this'

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    checks = db.relationship('URLCheck', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class URLCheck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Nullable for non-logged-in users
    url = db.Column(db.String(500), nullable=False)
    is_phishing = db.Column(db.Boolean, nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    risk_score = db.Column(db.Float, nullable=False)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url[:50] + '...' if len(self.url) > 50 else self.url,
            'is_phishing': self.is_phishing,
            'confidence': f"{self.confidence:.2%}",
            'risk_level': self.risk_level,
            'risk_score': self.risk_score,
            'checked_at': self.checked_at.strftime('%Y-%m-%d %H:%M:%S')
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False) == 'on'
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validation
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get user statistics
    total_checks = URLCheck.query.filter_by(user_id=current_user.id).count()
    phishing_detected = URLCheck.query.filter_by(user_id=current_user.id, is_phishing=True).count()
    safe_sites = URLCheck.query.filter_by(user_id=current_user.id, is_phishing=False).count()
    
    # Get recent checks
    recent_checks = URLCheck.query.filter_by(user_id=current_user.id)\
        .order_by(URLCheck.checked_at.desc())\
        .limit(10)\
        .all()
    
    # Calculate average confidence
    avg_confidence = db.session.query(db.func.avg(URLCheck.confidence))\
        .filter_by(user_id=current_user.id)\
        .scalar() or 0
    
    stats = {
        'total_checks': total_checks,
        'phishing_detected': phishing_detected,
        'safe_sites': safe_sites,
        'avg_confidence': f"{avg_confidence:.2%}",
        'phishing_rate': f"{(phishing_detected/total_checks*100):.1f}" if total_checks > 0 else "0"
    }
    
    return render_template('dashboard.html', stats=stats, recent_checks=recent_checks)

@app.route('/check-url', methods=['GET', 'POST'])
def check_url():
    if request.method == 'POST':
        url = request.form.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'Please enter a URL'}), 400
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
        
        # Analyze URL
        result = detector.analyze_url(url)
        
        # Save to database if user is logged in
        if current_user.is_authenticated and not result['error']:
            check = URLCheck(
                user_id=current_user.id,
                url=url,
                is_phishing=result['is_phishing'],
                confidence=result['confidence'],
                risk_level=result['risk_level'],
                risk_score=result['risk_score']
            )
            db.session.add(check)
            db.session.commit()
            
            result['check_id'] = check.id
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(result)
        
        return render_template('check-url.html', result=result, url=url)
    
    return render_template('check-url.html')

@app.route('/history')
@login_required
def history():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    checks = URLCheck.query.filter_by(user_id=current_user.id)\
        .order_by(URLCheck.checked_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    total_checks = URLCheck.query.filter_by(user_id=current_user.id).count()
    phishing_count = URLCheck.query.filter_by(user_id=current_user.id, is_phishing=True).count()
    safe_count = URLCheck.query.filter_by(user_id=current_user.id, is_phishing=False).count()
    phishing_rate = (phishing_count / total_checks * 100) if total_checks > 0 else 0

    stats = {
        'total_checks': total_checks,
        'phishing_count': phishing_count,
        'safe_count': safe_count,
        'phishing_rate': phishing_rate
    }
    
    return render_template('history.html', checks=checks, stats=stats)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/api/check-url', methods=['POST'])
def api_check_url():
    """API endpoint for URL checking"""
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    url = data['url'].strip()
    
    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
    
    # Analyze URL
    result = detector.analyze_url(url)
    
    if result['error']:
        return jsonify({'error': result['error']}), 500
    
    # Save to database if API key provided (simplified)
    if data.get('save_result') and current_user.is_authenticated:
        check = URLCheck(
            user_id=current_user.id,
            url=url,
            is_phishing=result['is_phishing'],
            confidence=result['confidence'],
            risk_level=result['risk_level'],
            risk_score=result['risk_score']
        )
        db.session.add(check)
        db.session.commit()
    
    return jsonify(result)

@app.route('/api/stats/<int:user_id>')
@login_required
def api_user_stats(user_id):
    """API endpoint for user statistics"""
    if user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    days = request.args.get('days', 30, type=int)
    since_date = datetime.utcnow() - timedelta(days=days)
    
    checks = URLCheck.query.filter(
        URLCheck.user_id == user_id,
        URLCheck.checked_at >= since_date
    ).all()
    
    # Prepare statistics
    total = len(checks)
    phishing = sum(1 for c in checks if c.is_phishing)
    safe = total - phishing
    
    # Daily breakdown
    daily_stats = {}
    for check in checks:
        date_str = check.checked_at.strftime('%Y-%m-%d')
        if date_str not in daily_stats:
            daily_stats[date_str] = {'total': 0, 'phishing': 0}
        daily_stats[date_str]['total'] += 1
        if check.is_phishing:
            daily_stats[date_str]['phishing'] += 1
    
    stats = {
        'total_checks': total,
        'phishing_detected': phishing,
        'safe_sites': safe,
        'phishing_rate': f"{(phishing/total*100):.1f}" if total > 0 else "0",
        'daily_stats': daily_stats
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)