// URL Checker JavaScript
class URLChecker {
    constructor() {
        this.form = document.getElementById('urlCheckForm');
        this.input = document.getElementById('urlInput');
        this.button = document.getElementById('checkBtn');
        this.loader = document.getElementById('loader');
        this.resultCard = document.getElementById('resultCard');
        this.history = [];
        
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.setupEventListeners();
        this.loadHistory();
        this.setupAutocomplete();
        this.setupUrlPreview();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        this.input.addEventListener('input', () => {
            this.validateUrl();
            this.previewUrl();
        });
        
        this.input.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.validateUrl();
                this.previewUrl();
            }, 100);
        });

        // Add keyboard shortcut (Ctrl+Enter) to submit
        this.input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.form.dispatchEvent(new Event('submit'));
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const url = this.input.value.trim();
        
        if (!this.validateUrl()) {
            this.showError('Please enter a valid URL');
            return;
        }

        // Add to history
        this.addToHistory(url);

        // Show loading state
        this.setLoadingState(true);

        try {
            const result = await this.checkUrl(url);
            this.displayResult(result);
            this.saveToHistory(result);
        } catch (error) {
            this.showError('Failed to analyze URL. Please try again.');
            console.error('URL check error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    validateUrl() {
        const url = this.input.value.trim();
        
        if (!url) {
            this.input.classList.remove('valid', 'invalid');
            return false;
        }

        // More comprehensive URL validation
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        const isValid = urlPattern.test(url) || this.isIpAddress(url);
        
        this.input.classList.toggle('valid', isValid);
        this.input.classList.toggle('invalid', !isValid);
        
        return isValid;
    }

    isIpAddress(url) {
        // Remove protocol if present
        const cleanUrl = url.replace(/^https?:\/\//, '');
        
        // Check if it's an IP address
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
        if (!ipPattern.test(cleanUrl.split('/')[0])) return false;
        
        // Validate each octet
        const ipPart = cleanUrl.split('/')[0].split(':')[0];
        const octets = ipPart.split('.');
        return octets.every(octet => {
            const num = parseInt(octet, 10);
            return num >= 0 && num <= 255;
        });
    }

    async checkUrl(url) {
        // Add protocol if missing
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        // Show appropriate loading message
        this.updateLoadingMessage('Extracting URL features...');

        // Simulate feature extraction
        await this.sleep(800);
        this.updateLoadingMessage('Analyzing with ML models...');

        // Simulate model prediction
        await this.sleep(1200);
        this.updateLoadingMessage('Calculating risk score...');

        await this.sleep(600);

        // In production, this would be an actual API call
        // return await ajaxRequest('/api/check-url', 'POST', { url });

        // Simulate API response for demo
        return this.simulateAnalysis(url);
    }

    simulateAnalysis(url) {
        // Simulate different results based on URL patterns
        const isPhishing = this.isSuspiciousUrl(url);
        const confidence = isPhishing ? 0.85 + Math.random() * 0.14 : 0.90 + Math.random() * 0.09;
        const riskScore = isPhishing ? 70 + Math.random() * 30 : Math.random() * 30;
        
        let riskLevel = 'LOW';
        if (riskScore > 80) riskLevel = 'CRITICAL';
        else if (riskScore > 60) riskLevel = 'HIGH';
        else if (riskScore > 30) riskLevel = 'MEDIUM';

        const features = this.extractFeatures(url);
        const analysis = this.generateAnalysis(url, features, riskLevel);

        return {
            url: url,
            is_phishing: isPhishing,
            confidence: confidence,
            risk_level: riskLevel,
            risk_score: riskScore,
            features: features,
            analysis: analysis
        };
    }

    isSuspiciousUrl(url) {
        const suspiciousPatterns = [
            /login|signin|account|verify|secure|update|confirm/i,
            /bit\.ly|tinyurl|goo\.gl|ow\.ly|is\.gd/i,
            /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/,
            /paypal|apple|microsoft|google.*\.(xyz|top|club|online)/i,
            /@/,
            /%[0-9a-f]{2}/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    extractFeatures(url) {
        const urlObj = new URL(url);
        const features = {};

        // Basic features
        features.url_length = url.length;
        features.domain = urlObj.hostname;
        features.path = urlObj.pathname;
        features.has_https = urlObj.protocol === 'https:';
        features.has_subdomain = (urlObj.hostname.match(/\./g) || []).length > 1;
        
        // Count special characters
        features.special_chars = {
            dots: (url.match(/\./g) || []).length,
            hyphens: (url.match(/-/g) || []).length,
            underscores: (url.match(/_/g) || []).length,
            slashes: (url.match(/\//g) || []).length,
            at: (url.match(/@/g) || []).length
        };

        // Check for IP
        features.has_ip = this.isIpAddress(url);

        // Check for URL shorteners
        const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 'ow.ly', 'is.gd'];
        features.is_shortened = shorteners.some(s => url.includes(s));

        return features;
    }

    generateAnalysis(url, features, riskLevel) {
        const analysis = {
            suspicious_patterns: [],
            recommendations: []
        };

        // Check for suspicious patterns
        if (features.has_ip) {
            analysis.suspicious_patterns.push('URL contains IP address instead of domain name');
        }

        if (features.is_shortened) {
            analysis.suspicious_patterns.push('URL uses a URL shortening service (hides actual destination)');
        }

        if (!features.has_https) {
            analysis.suspicious_patterns.push('URL does not use HTTPS encryption');
        }

        if (features.special_chars.at > 0) {
            analysis.suspicious_patterns.push('URL contains @ symbol which can be used for deception');
        }

        if (features.special_chars.dots > 4) {
            analysis.suspicious_patterns.push('Unusually high number of dots in URL');
        }

        if (features.url_length > 100) {
            analysis.suspicious_patterns.push('URL is unusually long (possible obfuscation)');
        }

        // Check for typosquatting
        const commonDomains = ['google', 'facebook', 'amazon', 'paypal', 'microsoft', 'apple'];
        const domain = features.domain.toLowerCase();
        for (const common of commonDomains) {
            if (domain.includes(common) && !domain.includes(common + '.')) {
                analysis.suspicious_patterns.push(`Possible typosquatting: contains "${common}" but not the official domain`);
                break;
            }
        }

        // Generate recommendations based on risk level
        if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
            analysis.recommendations.push('🚫 DO NOT visit this website');
            analysis.recommendations.push('🔒 Never enter personal information');
            analysis.recommendations.push('⚠️ Close this tab immediately');
            analysis.recommendations.push('📢 Report this site to help protect others');
        } else if (riskLevel === 'MEDIUM') {
            analysis.recommendations.push('⚠️ Exercise extreme caution');
            analysis.recommendations.push('🔍 Verify website legitimacy through official channels');
            analysis.recommendations.push('📧 Check for contact information and privacy policy');
            analysis.recommendations.push('💳 Do not enter payment information');
        } else {
            analysis.recommendations.push('✅ Site appears safe, but always stay vigilant');
            analysis.recommendations.push('🔄 Keep your browser and security software updated');
            analysis.recommendations.push('🔐 Enable two-factor authentication where possible');
        }

        // Add general recommendations
        analysis.recommendations.push('📚 Learn more about phishing at our security blog');

        return analysis;
    }

    displayResult(result) {
        if (!this.resultCard) return;

        // Update result card classes
        this.resultCard.className = `result-card ${result.is_phishing ? 'result-phishing' : 'result-safe'}`;
        
        // Update icon and title
        const icon = this.resultCard.querySelector('.result-icon i');
        const title = this.resultCard.querySelector('.result-title h3');
        const subtitle = this.resultCard.querySelector('.result-title p');
        
        icon.className = `fas ${result.is_phishing ? 'fa-exclamation-triangle' : 'fa-check-circle'}`;
        title.textContent = result.is_phishing ? '⚠️ Phishing Detected!' : '✅ Safe Website';
        subtitle.textContent = `URL: ${result.url}`;

        // Update details
        const details = this.resultCard.querySelectorAll('.detail-item');
        details[0].querySelector('.detail-value').textContent = 
            `${(result.confidence * 100).toFixed(1)}%`;
        details[1].querySelector('.detail-value').textContent = result.risk_level;
        details[2].querySelector('.detail-value').textContent = 
            `${result.risk_score.toFixed(1)}/100`;

        // Update risk meter
        const riskFill = this.resultCard.querySelector('.risk-meter-fill');
        riskFill.style.width = `${result.risk_score}%`;
        
        const riskLabel = this.resultCard.querySelector('.risk-meter-label span:last-child');
        riskLabel.textContent = result.risk_level;

        // Update analysis section
        const analysisSection = this.resultCard.querySelector('.analysis-section');
        if (analysisSection) {
            // Suspicious patterns
            const patternsList = analysisSection.querySelector('.suspicious-list');
            if (patternsList && result.analysis.suspicious_patterns.length > 0) {
                patternsList.innerHTML = result.analysis.suspicious_patterns
                    .map(p => `<li>${p}</li>`)
                    .join('');
                patternsList.closest('.analysis-section').style.display = 'block';
            } else if (patternsList) {
                patternsList.closest('.analysis-section').style.display = 'none';
            }

            // Recommendations
            const recommendationsList = analysisSection.querySelector('.recommendations-list');
            if (recommendationsList) {
                recommendationsList.innerHTML = result.analysis.recommendations
                    .map(r => `<li>${r}</li>`)
                    .join('');
            }
        }

        // Show the result card with animation
        this.resultCard.style.display = 'block';
        this.resultCard.classList.add('animate-pop-in');

        // Scroll to results
        this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Announce result for screen readers
        this.announceResult(result);
    }

    announceResult(result) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `Analysis complete. ${result.is_phishing ? 'Warning: Phishing detected' : 'Site appears safe'}. Risk level: ${result.risk_level}`;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 3000);
    }

    setLoadingState(isLoading) {
        if (!this.loader) return;

        this.loader.classList.toggle('active', isLoading);
        this.button.disabled = isLoading;
        this.input.disabled = isLoading;

        if (isLoading) {
            this.button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            if (this.resultCard) {
                this.resultCard.style.display = 'none';
            }
        } else {
            this.button.innerHTML = '<i class="fas fa-search"></i> Check';
            this.input.disabled = false;
        }
    }

    updateLoadingMessage(message) {
        const loaderText = this.loader?.querySelector('p');
        if (loaderText) {
            loaderText.textContent = message;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showError(message) {
        showNotification(message, 'error');
    }

    // URL Preview functionality
    setupUrlPreview() {
        const preview = document.createElement('div');
        preview.className = 'url-preview';
        preview.id = 'urlPreview';
        this.input.parentNode.appendChild(preview);
    }

    previewUrl() {
        const preview = document.getElementById('urlPreview');
        if (!preview) return;

        const url = this.input.value.trim();
        
        if (url) {
            let previewUrl = url;
            if (!previewUrl.startsWith('http')) {
                previewUrl = 'https://' + previewUrl;
            }
            
            try {
                const urlObj = new URL(previewUrl);
                preview.innerHTML = `
                    <i class="fas fa-globe"></i>
                    <span>Preview: ${urlObj.hostname}</span>
                    ${urlObj.pathname !== '/' ? `<span class="path">${urlObj.pathname}</span>` : ''}
                `;
                preview.style.display = 'flex';
            } catch {
                preview.style.display = 'none';
            }
        } else {
            preview.style.display = 'none';
        }
    }

    // History management
    loadHistory() {
        try {
            this.history = JSON.parse(localStorage.getItem('urlHistory')) || [];
        } catch {
            this.history = [];
        }
    }

    addToHistory(url) {
        this.history.unshift({
            url: url,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 20 items
        if (this.history.length > 20) {
            this.history.pop();
        }
        
        localStorage.setItem('urlHistory', JSON.stringify(this.history));
        this.updateHistoryDropdown();
    }

    saveToHistory(result) {
        const historyItem = {
            ...result,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };

        // In production, this would save to backend
        console.log('Saving to history:', historyItem);
    }

    updateHistoryDropdown() {
        const dropdown = document.getElementById('urlHistory');
        if (!dropdown) return;

        if (this.history.length === 0) {
            dropdown.innerHTML = '<div class="history-empty">No recent URLs</div>';
            return;
        }

        dropdown.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="checker.setUrl('${item.url}')">
                <i class="fas fa-history"></i>
                <span class="history-url">${this.truncateUrl(item.url)}</span>
                <span class="history-time">${this.timeAgo(item.timestamp)}</span>
            </div>
        `).join('');
    }

    truncateUrl(url, maxLength = 40) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    timeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }
        
        return 'just now';
    }

    setUrl(url) {
        this.input.value = url;
        this.validateUrl();
        this.previewUrl();
        this.input.focus();
    }

    // Autocomplete functionality
    setupAutocomplete() {
        const datalist = document.createElement('datalist');
        datalist.id = 'url-suggestions';
        
        const commonUrls = [
            'https://google.com',
            'https://facebook.com',
            'https://amazon.com',
            'https://youtube.com',
            'https://twitter.com',
            'https://linkedin.com',
            'https://github.com',
            'https://stackoverflow.com',
            'https://microsoft.com',
            'https://apple.com'
        ];

        commonUrls.forEach(url => {
            const option = document.createElement('option');
            option.value = url;
            datalist.appendChild(option);
        });

        document.body.appendChild(datalist);
        this.input.setAttribute('list', 'url-suggestions');
    }

    // Copy result to clipboard
    copyResult() {
        if (!this.resultCard) return;

        const resultText = this.resultCard.innerText;
        navigator.clipboard.writeText(resultText)
            .then(() => showNotification('Result copied to clipboard', 'success'))
            .catch(() => showNotification('Failed to copy', 'error'));
    }

    // Share result
    shareResult() {
        if (navigator.share) {
            navigator.share({
                title: 'PhishGuard URL Analysis',
                text: `URL analysis result: ${this.resultCard.querySelector('.result-title p').textContent}`,
                url: window.location.href
            }).catch(() => {});
        } else {
            this.copyResult();
        }
    }
}

// Initialize URL checker
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('urlCheckForm')) {
        window.checker = new URLChecker();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + N for new check
    if (e.altKey && e.key === 'n' && window.checker) {
        e.preventDefault();
        window.checker.input.focus();
    }
    
    // Alt + H for history
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        document.getElementById('urlHistory')?.classList.toggle('show');
    }
});