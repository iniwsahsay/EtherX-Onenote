// Mock OTP Service for Local Testing
class MockOTPService {
    constructor() {
        this.mockOTP = '123456';
    }

    async generateOTP(identifier) {
        console.log(`Mock OTP for ${identifier}: ${this.mockOTP}`);
        return { success: true, message: 'OTP sent successfully' };
    }

    async verifyOTP(identifier, otp) {
        return { success: otp === this.mockOTP, error: otp !== this.mockOTP ? 'Invalid OTP' : null };
    }
}

// Override OTP service for local testing
window.mockOTPService = new MockOTPService();

// Enhanced auth with mock OTP
function enhanceAuthWithMockOTP() {
    document.getElementById('loginForm').onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        
        const result = await window.mockOTPService.generateOTP(email);
        if (result.success) {
            showOTPPage(email, 'login');
            showNotification('Mock OTP: 123456', 'info');
        }
    };
    
    document.getElementById('registerForm').onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        
        const result = await window.mockOTPService.generateOTP(email);
        if (result.success) {
            showOTPPage(email, 'register');
            showNotification('Mock OTP: 123456', 'info');
        }
    };
}

async function verifyOTP() {
    const otp = Array.from(document.querySelectorAll('.otp-input')).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showNotification('Please enter all 6 digits', 'error');
        return;
    }
    
    const result = await window.mockOTPService.verifyOTP(window.otpContext.identifier, otp);
    
    if (result.success) {
        currentUser = { email: window.otpContext.identifier };
        document.getElementById('userEmail').textContent = window.otpContext.identifier;
        document.getElementById('otpPage').style.display = 'none';
        document.getElementById('loadingPage').style.display = 'flex';
        simulateLoading();
    } else {
        showNotification('Invalid OTP. Try: 123456', 'error');
        document.querySelectorAll('.otp-input').forEach(input => input.value = '');
        document.getElementById('otp1').focus();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    enhanceAuthWithMockOTP();
});