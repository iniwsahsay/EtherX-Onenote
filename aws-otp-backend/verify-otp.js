const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { identifier, otp } = JSON.parse(event.body);
        
        // Get OTP from DynamoDB
        const result = await dynamodb.get({
            TableName: 'OTPTable',
            Key: { identifier }
        }).promise();
        
        if (!result.Item) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'OTP not found' })
            };
        }
        
        const { otp: storedOtp, expiresAt, attempts } = result.Item;
        
        // Check expiration
        if (Math.floor(Date.now() / 1000) > expiresAt) {
            await dynamodb.delete({
                TableName: 'OTPTable',
                Key: { identifier }
            }).promise();
            
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'OTP expired' })
            };
        }
        
        // Check attempts limit
        if (attempts >= 3) {
            await dynamodb.delete({
                TableName: 'OTPTable',
                Key: { identifier }
            }).promise();
            
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Too many attempts' })
            };
        }
        
        // Verify OTP
        if (otp === storedOtp) {
            // Delete OTP after successful verification
            await dynamodb.delete({
                TableName: 'OTPTable',
                Key: { identifier }
            }).promise();
            
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, message: 'OTP verified' })
            };
        } else {
            // Increment attempts
            await dynamodb.update({
                TableName: 'OTPTable',
                Key: { identifier },
                UpdateExpression: 'SET attempts = attempts + :inc',
                ExpressionAttributeValues: { ':inc': 1 }
            }).promise();
            
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Invalid OTP' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};