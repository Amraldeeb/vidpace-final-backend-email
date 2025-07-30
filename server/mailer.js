const nodemailer = require('nodemailer');

/**
 * Get SMTP configuration based on email provider
 * @param {string} email - Email address to determine provider
 * @returns {Object} SMTP configuration object
 */
function getSMTPConfig(email) {
    const domain = email.split('@')[1].toLowerCase();
    
    // Common email provider configurations
    const providers = {
        // Added vidpace.com domain configuration
'vidpace.com': {
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    requireTLS: true
}
        // Gmail
        'gmail.com': {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        // Outlook/Hotmail/Live
        'outlook.com': {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        'hotmail.com': {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        'live.com': {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        // Yahoo
        'yahoo.com': {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        'yahoo.co.uk': {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        // iCloud
        'icloud.com': {
            host: 'smtp.mail.me.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        'me.com': {
            host: 'smtp.mail.me.com',
            port: 587,
            secure: false,
            requireTLS: true
        },
        // Namecheap Private Email
        'privateemail.com': {
            host: 'mail.privateemail.com',
            port: 587,
            secure: false,
            requireTLS: true
        }
    };

    // Check if we have a specific configuration for this domain
    if (providers[domain]) {
        return providers[domain];
    }

    // For custom domains or unknown providers, try common configurations
    // First try with the domain itself
    const customConfigs = [
        {
            host: `smtp.${domain}`,
            port: 587,
            secure: false,
            requireTLS: true
        },
        {
            host: `mail.${domain}`,
            port: 587,
            secure: false,
            requireTLS: true
        },
        {
            host: `smtp.${domain}`,
            port: 465,
            secure: true,
            requireTLS: false
        },
        {
            host: `mail.${domain}`,
            port: 465,
            secure: true,
            requireTLS: false
        }
    ];

    return customConfigs[0]; // Return the first attempt
}

/**
 * Send email using Nodemailer with automatic SMTP configuration
 * @param {Object} emailData - Email configuration object
 * @param {string} emailData.from - Sender email address
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML email body
 * @param {Object} emailData.auth - Authentication credentials
 * @param {string} emailData.auth.user - SMTP username (email)
 * @param {string} emailData.auth.pass - SMTP password
 * @returns {Promise} - Promise that resolves with email result
 */
async function sendEmail(emailData) {
    const senderEmail = emailData.auth.user;
    const smtpConfig = getSMTPConfig(senderEmail);
    
    console.log(`Using SMTP configuration for ${senderEmail}:`, {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure
    });

    // Try multiple configurations if the first one fails
    const configsToTry = [
        smtpConfig,
        // Fallback configurations
        {
            host: smtpConfig.host,
            port: 465,
            secure: true,
            requireTLS: false
        },
        {
            host: smtpConfig.host,
            port: 25,
            secure: false,
            requireTLS: true
        }
    ];

    let lastError = null;

    for (let i = 0; i < configsToTry.length; i++) {
        const config = configsToTry[i];
        
        try {
            console.log(`Attempt ${i + 1}: Trying SMTP config:`, {
                host: config.host,
                port: config.port,
                secure: config.secure
            });

            // Create transporter with current configuration
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: {
                    user: emailData.auth.user,
                    pass: emailData.auth.pass
                },
                tls: {
                    rejectUnauthorized: false,
                    ciphers: 'SSLv3'
                },
                // Connection timeouts
                connectionTimeout: 60000, // 60 seconds
                greetingTimeout: 30000, // 30 seconds
                socketTimeout: 60000, // 60 seconds
                // Retry settings
                pool: false, // Disable connection pooling for better error handling
                maxConnections: 1,
                maxMessages: 1
            });

            // Verify SMTP connection configuration
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');

            // Prepare email options
            const mailOptions = {
                from: {
                    name: 'Vidpace Sales Team',
                    address: emailData.from
                },
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                // Optional: Add text version for better compatibility
                text: emailData.html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
                // Email headers
                headers: {
                    'X-Mailer': 'Vidpace Email Sender v1.0',
                    'X-Priority': '3', // Normal priority
                }
            };

            console.log(`Sending email from ${emailData.from} to ${emailData.to}...`);

            // Send email
            const result = await transporter.sendMail(mailOptions);

            console.log('Email sent successfully:', {
                messageId: result.messageId,
                response: result.response,
                accepted: result.accepted,
                rejected: result.rejected
            });

            return result;

        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            lastError = error;
            
            // If this is not the last attempt, continue to next configuration
            if (i < configsToTry.length - 1) {
                console.log('Trying next configuration...');
                continue;
            }
        }
    }

    // All attempts failed, throw the last error with enhanced information
    console.error('All SMTP configuration attempts failed');
    
    // Enhanced error handling with specific error types
    if (lastError.code === 'EAUTH') {
        throw new Error('SMTP Authentication failed. Please check your email credentials. For Gmail, you may need to use an App Password instead of your regular password.');
    } else if (lastError.code === 'ECONNECTION' || lastError.code === 'ENOTFOUND') {
        throw new Error('Failed to connect to SMTP server. Please check your internet connection and email provider settings.');
    } else if (lastError.code === 'ETIMEDOUT') {
        throw new Error('SMTP connection timed out. Please try again or check your firewall settings.');
    } else if (lastError.responseCode === 550) {
        throw new Error('Recipient email address was rejected by the server.');
    } else if (lastError.responseCode === 554) {
        throw new Error('Email rejected due to policy reasons. Please check the content.');
    } else {
        throw new Error(`Failed to send email: ${lastError.message}`);
    }
}

/**
 * Test SMTP connection with given credentials
 * @param {string} email - Email address
 * @param {string} password - Email password
 * @returns {Promise<boolean>} - Promise that resolves to true if connection is successful
 */
async function testSMTPConnection(email, password) {
    try {
        const smtpConfig = getSMTPConfig(email);
        
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: email,
                pass: password
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.verify();
        console.log('SMTP connection test successful for:', email);
        return true;
    } catch (error) {
        console.error('SMTP connection test failed for:', email, error.message);
        return false;
    }
}

module.exports = {
    sendEmail,
    testSMTPConnection,
    getSMTPConfig
};

