// Constitution Website Security & Consent System

class SecurityManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.queryLog = [];
        this.init();
    }

    init() {
        // Initialize rate limiter
        this.initRateLimiter();
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Check if user has consented
    hasConsent() {
        const consent = localStorage.getItem('constitutionConsent');
        if (!consent) return false;
        
        // Check if consent is still valid (30 days)
        const consentData = JSON.parse(consent);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - consentData.timestamp > thirtyDays) {
            localStorage.removeItem('constitutionConsent');
            return false;
        }
        return true;
    }

    // Show consent modal
    showConsentModal() {
        const modal = document.createElement('div');
        modal.id = 'consent-modal';
        modal.className = 'consent-modal';
        modal.innerHTML = `
            <div class="consent-content">
                <h2>Terms of Service & Privacy Notice</h2>
                
                <div class="consent-section">
                    <h3>📜 Terms of Service</h3>
                    <div class="consent-text">
                        <p><strong>By using this Constitutional AI service, you agree to:</strong></p>
                        <ol>
                            <li>Use this service for lawful educational purposes only</li>
                            <li>Not submit queries promoting violence, illegal activities, or harm</li>
                            <li>Understand this is NOT legal advice - consult an attorney for legal matters</li>
                            <li>Be at least 13 years of age</li>
                            <li>Accept that violations may be reported to authorities</li>
                        </ol>
                    </div>
                </div>

                <div class="consent-section">
                    <h3>🔐 Data Collection & Privacy</h3>
                    <div class="consent-text">
                        <p><strong>We collect and process:</strong></p>
                        <ul>
                            <li>Your IP address for security and rate limiting</li>
                            <li>Search queries for service improvement and security</li>
                            <li>Browser information (user agent) for compatibility</li>
                            <li>Timestamp and session data for audit purposes</li>
                        </ul>
                        
                        <p><strong>Your data is:</strong></p>
                        <ul>
                            <li>Sent to Microsoft Azure for AI processing</li>
                            <li>Logged for security and legal compliance</li>
                            <li>Retained for up to 90 days</li>
                            <li>Shared with law enforcement if required by law</li>
                        </ul>
                    </div>
                </div>

                <div class="consent-section">
                    <h3>⚖️ Legal Disclaimer</h3>
                    <div class="consent-text">
                        <p>This service provides general constitutional information for educational purposes only. 
                        It does not constitute legal advice. No attorney-client relationship is formed. 
                        For specific legal matters, consult a qualified attorney.</p>
                    </div>
                </div>

                <div class="consent-section">
                    <h3>🍪 Cookie Policy</h3>
                    <div class="consent-text">
                        <p>We use essential cookies (localStorage) to:</p>
                        <ul>
                            <li>Remember your consent preferences</li>
                            <li>Implement rate limiting</li>
                            <li>Track session for security</li>
                        </ul>
                    </div>
                </div>

                <div class="consent-checkbox">
                    <input type="checkbox" id="consent-agree" />
                    <label for="consent-agree">
                        I have read, understood, and agree to the Terms of Service and Privacy Policy
                    </label>
                </div>

                <div class="consent-checkbox">
                    <input type="checkbox" id="consent-age" />
                    <label for="consent-age">
                        I confirm that I am at least 13 years of age
                    </label>
                </div>

                <div class="consent-buttons">
                    <button id="consent-accept" class="consent-accept" disabled>Accept & Continue</button>
                    <button id="consent-decline" class="consent-decline">Decline & Leave</button>
                </div>

                <div class="consent-footer">
                    <p>By clicking "Accept & Continue", you acknowledge that your IP address 
                    (${this.getClientIP()}) and all queries will be logged and may be shared 
                    with Microsoft and law enforcement if necessary.</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        const agreeCheckbox = document.getElementById('consent-agree');
        const ageCheckbox = document.getElementById('consent-age');
        const acceptButton = document.getElementById('consent-accept');
        const declineButton = document.getElementById('consent-decline');

        // Enable accept button only if both checkboxes are checked
        const checkBoxes = () => {
            acceptButton.disabled = !(agreeCheckbox.checked && ageCheckbox.checked);
        };

        agreeCheckbox.addEventListener('change', checkBoxes);
        ageCheckbox.addEventListener('change', checkBoxes);

        acceptButton.addEventListener('click', () => {
            this.saveConsent();
            modal.remove();
            this.logEvent('consent_accepted');
        });

        declineButton.addEventListener('click', () => {
            this.logEvent('consent_declined');
            modal.remove();
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: serif;">
                    <h2>Access Denied</h2>
                    <p>You must accept the Terms of Service to use this service.</p>
                    <p>You may review the Constitution text without using the AI features.</p>
                </div>
            `;
        });
    }

    // Save consent
    saveConsent() {
        const consentData = {
            timestamp: Date.now(),
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            version: '1.0'
        };
        localStorage.setItem('constitutionConsent', JSON.stringify(consentData));
    }

    // Get client IP (will be set by Cloudflare headers in production)
    getClientIP() {
        // In production, this would come from Cloudflare headers
        // For now, return placeholder
        return 'Client IP';
    }

    // Rate limiter
    initRateLimiter() {
        this.rateLimit = {
            maxQueries: 10,
            windowMs: 60 * 60 * 1000, // 1 hour
            
            canQuery() {
                const now = Date.now();
                let queries = JSON.parse(localStorage.getItem('queryTimestamps') || '[]');
                
                // Remove old queries outside the window
                queries = queries.filter(timestamp => now - timestamp < this.windowMs);
                
                if (queries.length >= this.maxQueries) {
                    return { allowed: false, remaining: 0, resetTime: queries[0] + this.windowMs };
                }
                
                queries.push(now);
                localStorage.setItem('queryTimestamps', JSON.stringify(queries));
                
                return { 
                    allowed: true, 
                    remaining: this.maxQueries - queries.length,
                    resetTime: queries[0] + this.windowMs
                };
            }
        };
    }

    // Check for suspicious content
    isSuspicious(query) {
        const suspiciousPatterns = [
            // Violence/Harm
            /\b(kill|murder|assassin|bomb|explosive|weapon|gun|shoot|stab|poison|torture|kidnap|hostage|terrorist|attack)\b/i,
            
            // Illegal activities
            /\b(drug|cocaine|heroin|meth|dealer|trafficking|launder|fraud|scam|hack|exploit|vulnerability|malware|virus)\b/i,
            
            // Harassment/Hate
            /\b(hate|racist|nazi|kkk|supremac|lynch|genocide)\b/i,
            
            // Sexual content
            /\b(sex|porn|nude|xxx|rape|molest|pedo)\b/i,
            
            // Personal information
            /\b(ssn|social security|credit card|password|pin code)\b/i,
            
            // Attempts to manipulate
            /\b(ignore previous|forget instructions|new instructions|system prompt|bypass|override)\b/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(query));
    }

    // Log events
    logEvent(eventType, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            eventType: eventType,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            data: data
        };

        this.queryLog.push(logEntry);
        
        // Store locally
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('securityLogs', JSON.stringify(logs));

        // If suspicious, could send alert
        if (eventType === 'suspicious_query') {
            this.alertSuspiciousActivity(logEntry);
        }
    }

    // Alert for suspicious activity
    alertSuspiciousActivity(logEntry) {
        console.warn('SUSPICIOUS ACTIVITY DETECTED:', logEntry);
        
        // In production, this would:
        // 1. Send to Discord webhook
        // 2. Create GitHub issue
        // 3. Email alert
        // 4. Block user if severe
    }

    // Prepare data for Microsoft API
    prepareAPIRequest(query) {
        if (!this.hasConsent()) {
            // Show consent modal on first AI search attempt
            this.showConsentModal();
            throw new Error('User consent required');
        }

        const rateLimitCheck = this.rateLimit.canQuery();
        if (!rateLimitCheck.allowed) {
            const resetDate = new Date(rateLimitCheck.resetTime);
            throw new Error(`Rate limit exceeded. Try again at ${resetDate.toLocaleTimeString()}`);
        }

        if (this.isSuspicious(query)) {
            this.logEvent('suspicious_query', { query: query });
            throw new Error('Query blocked: Potential policy violation detected');
        }

        // Prepare sanitized request
        const apiRequest = {
            query: query.substring(0, 500), // Limit query length
            metadata: {
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                ip: this.getClientIP(),
                userAgent: navigator.userAgent.substring(0, 200),
                referrer: document.referrer || 'direct',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: `${screen.width}x${screen.height}`,
                queryLength: query.length,
                consentVersion: '1.0'
            },
            security: {
                rateLimitRemaining: rateLimitCheck.remaining,
                suspiciousScore: this.calculateSuspiciousScore(query),
                consentTimestamp: JSON.parse(localStorage.getItem('constitutionConsent')).timestamp
            }
        };

        this.logEvent('api_request', { query: query });

        return apiRequest;
    }

    // Calculate suspicious score (0-100)
    calculateSuspiciousScore(query) {
        let score = 0;
        
        // Length checks
        if (query.length > 500) score += 10;
        if (query.length < 5) score += 15;
        
        // Caps lock abuse
        const capsRatio = (query.match(/[A-Z]/g) || []).length / query.length;
        if (capsRatio > 0.5) score += 20;
        
        // Special characters abuse
        const specialRatio = (query.match(/[^a-zA-Z0-9\s?.,']/g) || []).length / query.length;
        if (specialRatio > 0.3) score += 15;
        
        // Repetition
        if (/(.)\1{4,}/.test(query)) score += 20;
        
        // Known suspicious patterns (mild)
        if (/\b(test|debug|admin|root|system)\b/i.test(query)) score += 10;
        
        return Math.min(score, 100);
    }
}

// Initialize security manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.securityManager = new SecurityManager();
});

// Add CSS for consent modal
const style = document.createElement('style');
style.textContent = `
.consent-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.consent-content {
    background: white;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
}

.consent-content h2 {
    color: #8b4513;
    margin-bottom: 20px;
    text-align: center;
    border-bottom: 2px solid #8b4513;
    padding-bottom: 10px;
}

.consent-section {
    margin-bottom: 20px;
}

.consent-section h3 {
    color: #2e5d31;
    margin-bottom: 10px;
    font-size: 1.1rem;
}

.consent-text {
    background: #f9f9f9;
    padding: 15px;
    border-left: 3px solid #8b4513;
    font-size: 0.95rem;
    line-height: 1.6;
}

.consent-text ol, .consent-text ul {
    margin: 10px 0;
    padding-left: 25px;
}

.consent-text li {
    margin: 5px 0;
}

.consent-checkbox {
    margin: 15px 0;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 4px;
}

.consent-checkbox input {
    margin-right: 10px;
    transform: scale(1.2);
}

.consent-checkbox label {
    font-weight: 600;
    color: #333;
}

.consent-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 20px 0;
}

.consent-accept, .consent-decline {
    padding: 12px 30px;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.consent-accept {
    background: #2e5d31;
    color: white;
}

.consent-accept:hover:not(:disabled) {
    background: #3d7340;
}

.consent-accept:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.consent-decline {
    background: #8b4513;
    color: white;
}

.consent-decline:hover {
    background: #a0522d;
}

.consent-footer {
    margin-top: 20px;
    padding: 15px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    font-size: 0.85rem;
    text-align: center;
    color: #856404;
}

/* Rate limit warning */
.rate-limit-warning {
    background: #f8d7da;
    color: #721c24;
    padding: 15px;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin: 10px 0;
}

/* Suspicious query warning */
.suspicious-warning {
    background: #fff3cd;
    color: #856404;
    padding: 15px;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    margin: 10px 0;
}
`;
document.head.appendChild(style);