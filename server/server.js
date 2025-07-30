const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sendEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many email requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to email endpoint
app.use('/api/send-email', limiter);

// CORS configuration
app.use(cors({
    origin: '*', // Allow all origins for now
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Vidpace Email Sender API is running!',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
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
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist.'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong on the server.'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Vidpace Email Sender API is running on port ${PORT}`);
    console.log(`📧 Ready to send emails via SMTP`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

