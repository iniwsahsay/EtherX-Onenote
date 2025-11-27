# OTP Authentication Migration Guide

## Phase 1: AWS Infrastructure Setup

1. **Deploy Backend Services**
   ```bash
   cd aws-otp-backend
   npm install
   sam build
   sam deploy --guided
   ```

2. **Configure AWS Services**
   - Enable SNS for SMS delivery
   - Set up SES for email delivery
   - Configure DynamoDB TTL for automatic OTP cleanup

## Phase 2: Frontend Integration

1. **Add OTP Service Script**
   ```html
   <script src="otp-integration.js"></script>
   ```

2. **Update API Endpoint**
   ```javascript
   // Replace with your actual API Gateway URL
   const API_ENDPOINT = 'https://your-api-id.execute-api.region.amazonaws.com/Prod';
   ```

## Phase 3: Security Enhancements

1. **Rate Limiting**: Implement API Gateway throttling
2. **IP Whitelisting**: Add CloudFront with WAF rules
3. **Encryption**: Enable DynamoDB encryption at rest
4. **Monitoring**: Set up CloudWatch alarms for failed attempts

## Phase 4: Testing & Rollout

1. **Test OTP Flow**
   - Generate OTP → Verify OTP → Access granted
   - Test expiration (5 minutes)
   - Test attempt limits (3 max)

2. **Gradual Migration**
   - Enable OTP for new users first
   - Migrate existing users with email notification
   - Monitor error rates and user feedback

## Security Best Practices

- OTP expires in 5 minutes
- Maximum 3 verification attempts
- Rate limiting: 5 OTP requests per hour per user
- Secure random number generation
- No OTP logging in CloudWatch
- HTTPS-only communication