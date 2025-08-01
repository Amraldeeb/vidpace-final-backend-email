const { sendEmail } = require('../server/mailer');

// Vercel serverless function for sending emails
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only POST requests are allowed.'
        });
    }

    try {
        const {
            senderEmail,
            senderPassword,
            recipientEmail,
            recipientName,
            subject,
            emailBody
        } = req.body;

        // Validate required fields
        if (!senderEmail || !senderPassword || !recipientEmail || !recipientName || !subject || !emailBody) {
            return res.status(400).json({
                error: 'Missing required fields. Please provide all email details.'
            });
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(senderEmail)) {
            return res.status(400).json({
                error: 'Invalid sender email format.'
            });
        }

        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({
                error: 'Invalid recipient email format.'
            });
        }

        // Prepare email data
        const emailData = {
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            html: emailBody,
            auth: {
                user: senderEmail,
                pass: senderPassword
            }
        };

        console.log(`Attempting to send email from ${senderEmail} to ${recipientEmail}`);

        // Send email
        const result = await sendEmail(emailData);

        console.log('Email sent successfully:', result.messageId);

        res.json({
            success: true,
            message: 'Email sent successfully!',
            messageId: result.messageId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error sending email:', error);

        // Handle specific SMTP errors
        let errorMessage = 'Failed to send email. Please check your credentials and try again.';
        
        if (error.code === 'EAUTH') {
            errorMessage = 'Authentication failed. Please check your email and password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Connection failed. Please check your internet connection.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Please try again.';
        } else if (error.responseCode === 550) {
            errorMessage = 'Recipient email address rejected. Please check the email address.';
        }

        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

