// Dashboard JavaScript
class DashboardManager {
    constructor() {
        this.charts = {};
        this.data = {
            daily: [],
            riskDistribution: {},
            recentActivity: []
        };
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.initializeCharts();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    async loadDashboardData() {
        try {
            showLoading(true);
            
            // Simulate API calls - Replace with actual API endpoints
            const [stats, trends, activity] = await Promise.all([
                this.fetchStats(),
                this.fetchTrends(),
                this.fetchRecentActivity()
            ]);
            
            this.updateStats(stats);
            this.updateCharts(trends);
            this.updateRecentActivity(activity);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
        } finally {
            showLoading(false);
        }
    }

    async fetchStats() {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    totalChecks: 1250,
                    phishingDetected: 342,
                    safeSites: 908,
                    avgConfidence: 98.5,
                    weeklyChange: {
                        total: 12,
                        phishing: -5,
                        safe: 15
                    }
                });
            }, 1000);
        });
    }

    async fetchTrends() {
        // Simulate API call for trend data
        return new Promise(resolve => {
            const dates = [];
            const phishing = [];
            const safe = [];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                phishing.push(Math.floor(Math.random() * 20) + 5);
                safe.push(Math.floor(Math.random() * 30) + 10);
            }
            
            resolve({ dates, phishing, safe });
        });
    }

    async fetchRecentActivity() {
        // Simulate API call for recent activity
        return new Promise(resolve => {
            const activities = [
                { url: 'https://google.com', risk: 'low', time: '5 minutes ago', type: 'safe' },
                { url: 'https://secure-login.com', risk: 'critical', time: '15 minutes ago', type: 'phishing' },
                { url: 'https://amazon.com', risk: 'low', time: '1 hour ago', type: 'safe' },
                { url: 'https://paypal-verify.com', risk: 'high', time: '2 hours ago', type: 'phishing' },
                { url: 'https://github.com', risk: 'low', time: '3 hours ago', type: 'safe' }
            ];
            resolve(activities);
        });
    }

    initializeCharts() {
        this.initTrendChart();
        this.initRiskDistributionChart();
        this.initHourlyActivityChart();
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Phishing Detected',
                        data: [],
                        borderColor: '#ff4757',
                        backgroundColor: 'rgba(255, 71, 87, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ff4757',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Safe URLs',
                        data: [],
                        borderColor: '#26de81',
                        backgroundColor: 'rgba(38, 222, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#26de81',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 6
                        }
                    },
                    tooltip: {
                        backgroundColor: '#333',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw} URLs`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 10
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    initRiskDistributionChart() {
        const ctx = document.getElementById('riskDistributionChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.riskDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low', 'Safe'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#ff4757',
                        '#ff6b81',
                        '#ffa502',
                        '#26de81',
                        '#20bf6b'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
                }
            }
        });
    }

    initHourlyActivityChart() {
        const ctx = document.getElementById('hourlyActivityChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
                datasets: [
                    {
                        label: 'Phishing Attempts',
                        data: Array(12).fill(0).map(() => Math.floor(Math.random() * 15)),
                        backgroundColor: '#ff4757',
                        borderRadius: 5
                    },
                    {
                        label: 'Safe Checks',
                        data: Array(12).fill(0).map(() => Math.floor(Math.random() * 25)),
                        backgroundColor: '#26de81',
                        borderRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    updateStats(stats) {
        // Update stat cards with animation
        this.animateValue('total-checks', 0, stats.totalChecks, 2000);
        this.animateValue('phishing-detected', 0, stats.phishingDetected, 2000);
        this.animateValue('safe-sites', 0, stats.safeSites, 2000);
        this.animateValue('avg-confidence', 0, stats.avgConfidence, 2000, '%');
        
        // Update trend indicators
        this.updateTrend('total-trend', stats.weeklyChange.total);
        this.updateTrend('phishing-trend', stats.weeklyChange.phishing);
        this.updateTrend('safe-trend', stats.weeklyChange.safe);
    }

    animateValue(elementId, start, end, duration, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const animate = () => {
            current += increment;
            if (current >= end) {
                element.textContent = end.toLocaleString() + suffix;
                return;
            }
            element.textContent = Math.floor(current).toLocaleString() + suffix;
            requestAnimationFrame(animate);
        };

        animate();
    }

    updateTrend(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const icon = change > 0 ? '↑' : '↓';
        const color = change > 0 ? '#26de81' : '#ff4757';
        const prefix = change > 0 ? '+' : '';

        element.innerHTML = `${icon} ${prefix}${change}% from last week`;
        element.style.color = color;
    }

    updateCharts(trends) {
        if (this.charts.trend) {
            this.charts.trend.data.labels = trends.dates;
            this.charts.trend.data.datasets[0].data = trends.phishing;
            this.charts.trend.data.datasets[1].data = trends.safe;
            this.charts.trend.update();
        }

        // Update risk distribution based on actual data
        if (this.charts.riskDistribution) {
            // Simulate distribution data
            this.charts.riskDistribution.data.datasets[0].data = [45, 78, 120, 245, 762];
            this.charts.riskDistribution.update();
        }
    }

    updateRecentActivity(activities) {
        const container = document.querySelector('.activity-list');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item animate-slide-in">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${activity.type === 'phishing' ? 'exclamation-triangle' : 'check-circle'}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-url">${activity.url}</div>
                    <div class="activity-meta">
                        <span class="activity-time">
                            <i class="far fa-clock"></i> ${activity.time}
                        </span>
                        <span class="activity-risk risk-${activity.risk}">
                            ${activity.risk.toUpperCase()}
                        </span>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline" onclick="recheckURL('${activity.url}')">
                    <i class="fas fa-redo-alt"></i>
                </button>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Chart period buttons
        document.querySelectorAll('[data-chart-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.chartPeriod;
                this.changeChartPeriod(period);
                
                // Update active state
                document.querySelectorAll('[data-chart-period]').forEach(b => 
                    b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Refresh button
        document.getElementById('refreshDashboard')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Export buttons
        document.getElementById('exportStats')?.addEventListener('click', () => {
            this.exportDashboardData();
        });
    }

    async changeChartPeriod(period) {
        showLoading(true);
        
        // Fetch data for selected period
        const trends = await this.fetchTrendsForPeriod(period);
        
        this.updateCharts(trends);
        
        showLoading(false);
        showNotification(`Showing data for last ${period}`, 'info');
    }

    async fetchTrendsForPeriod(period) {
        // Simulate different data based on period
        return new Promise(resolve => {
            const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
            const dates = [];
            const phishing = [];
            const safe = [];
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                
                // Generate more realistic data
                const basePhishing = period === 'week' ? 15 : period === 'month' ? 12 : 10;
                const baseSafe = period === 'week' ? 25 : period === 'month' ? 22 : 20;
                
                phishing.push(Math.floor(Math.random() * basePhishing) + 5);
                safe.push(Math.floor(Math.random() * baseSafe) + 10);
            }
            
            resolve({ dates, phishing, safe });
        });
    }

    exportDashboardData() {
        const data = {
            stats: this.currentStats,
            trends: this.charts.trend?.data,
            timestamp: new Date().toISOString(),
            generatedBy: 'PhishGuard Dashboard'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phishguard-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        showNotification('Dashboard data exported successfully', 'success');
    }

    startRealTimeUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    printReport() {
        window.print();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-container')) {
        window.dashboard = new DashboardManager();
    }
});

// Helper function to recheck URL
function recheckURL(url) {
    window.location.href = `/check-url?url=${encodeURIComponent(url)}`;
}

// Export functions for use in HTML
window.exportChart = function(chartId, format = 'png') {
    const chart = dashboard.charts[chartId];
    if (!chart) return;

    const canvas = chart.canvas;
    const dataUrl = canvas.toDataURL(`image/${format}`);
    
    const link = document.createElement('a');
    link.download = `chart-${chartId}-${new Date().toISOString()}.${format}`;
    link.href = dataUrl;
    link.click();
};

window.toggleChartType = function(chartId, type) {
    const chart = dashboard.charts[chartId];
    if (!chart) return;

    chart.config.type = type;
    chart.update();
};

// Print styles for dashboard
const printStyles = document.createElement('style');
printStyles.textContent = `
    @media print {
        .navbar, .footer, .quick-actions, .chart-actions {
            display: none !important;
        }
        
        .dashboard-container {
            padding: 0;
            background: white;
        }
        
        .stat-card, .chart-card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ddd;
        }
        
        .welcome-section {
            background: #667eea;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    }
`;
document.head.appendChild(printStyles);