// OTP Integration for EtherX OneNote
class OTPService {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
    }

    async generateOTP(identifier, type = 'sms') {
        try {
            const response = await fetch(`${this.apiEndpoint}/generate-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    [type === 'sms' ? 'phone' : 'email']: identifier
                })
            });
            return await response.json();
        } catch (error) {
            throw new Error('Failed to generate OTP');
        }
    }

    async verifyOTP(identifier, otp) {
        try {
            const response = await fetch(`${this.apiEndpoint}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otp })
            });
            return await response.json();
        } catch (error) {
            throw new Error('Failed to verify OTP');
        }
    }
}

// Enhanced Authentication Flow
function enhanceAuthWithOTP() {
    const otpService = new OTPService('https://your-api-gateway-url.amazonaws.com/Prod');
    
    // Override existing form handlers
    const originalLoginHandler = document.getElementById('loginForm').onsubmit;
    const originalRegisterHandler = document.getElementById('registerForm').onsubmit;
    
    document.getElementById('loginForm').onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        
        try {
            // Generate OTP
            const result = await otpService.generateOTP(email, 'email');
            if (result.success) {
                showOTPPage(email, 'login');
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            showNotification('Authentication failed', 'error');
        }
    };
    
    document.getElementById('registerForm').onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        
        try {
            const result = await otpService.generateOTP(email, 'email');
            if (result.success) {
                showOTPPage(email, 'register');
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            showNotification('Registration failed', 'error');
        }
    };
}

function showOTPPage(identifier, flow) {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('otpPage').style.display = 'flex';
    
    // Store context for verification
    window.otpContext = { identifier, flow };
    
    // Focus first OTP input
    document.getElementById('otp1').focus();
}

async function verifyOTP() {
    const otp = Array.from(document.querySelectorAll('.otp-input'))
        .map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showNotification('Please enter all 6 digits', 'error');
        return;
    }
    
    try {
        const otpService = new OTPService('https://your-api-gateway-url.amazonaws.com/Prod');
        const result = await otpService.verifyOTP(window.otpContext.identifier, otp);
        
        if (result.success) {
            // Store authenticated user
            currentUser = { email: window.otpContext.identifier };
            document.getElementById('userEmail').textContent = window.otpContext.identifier;
            
            // Proceed to main app
            document.getElementById('otpPage').style.display = 'none';
            document.getElementById('loadingPage').style.display = 'flex';
            simulateLoading();
        } else {
            showNotification(result.error, 'error');
            // Clear OTP inputs on error
            document.querySelectorAll('.otp-input').forEach(input => input.value = '');
            document.getElementById('otp1').focus();
        }
    } catch (error) {
        showNotification('Verification failed', 'error');
    }
}

// Initialize OTP enhancement
document.addEventListener('DOMContentLoaded', function() {
    enhanceAuthWithOTP();
});