const nodemailer = require("nodemailer");

async function sendEmail(emailData) {
    let lastError = null;

    const configsToTry = [
        { host: 'mail.privateemail.com', port: 465, secure: true },
        { host: 'smtp.gmail.com', port: 465, secure: true },
        { host: 'smtp.office365.com', port: 587, secure: false },
        { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
        { host: 'smtp.mail.yahoo.com', port: 587, secure: false }
    ];

    function getSMTPConfig(email) {
        if (email.includes('@vidpace.com')) {
            return { host: 'mail.privateemail.com', port: 465, secure: true };
        } else if (email.includes('@gmail.com')) {
            return { host: 'smtp.gmail.com', port: 465, secure: true };
        } else if (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com')) {
            return { host: 'smtp.office365.com', port: 587, secure: false };
        } else if (email.includes('@yahoo.com')) {
            return { host: 'smtp.mail.yahoo.com', port: 465, secure: true };
        } else {
            // Default or error case
            return { host: 'mail.privateemail.com', port: 465, secure: true }; // Fallback to privateemail
        }
    }

    for (let i = 0; i < configsToTry.length; i++) {
        const config = configsToTry[i];
        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: {
                    user: emailData.auth.user,
                    pass: emailData.auth.pass
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            await transporter.verify();
            console.log("SMTP connection verified successfully");

            // Prepare email options
            const mailOptions = {
                from: {
                    name: "Vidpace Sales Team",
                    address: emailData.from
                },
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                // Optional: Add text version for better compatibility
                text: emailData.html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
                // Email headers
                headers: {
                    "X-Mailer": "Vidpace Email Sender v1.0",
                    "X-Priority": "3", // Normal priority
                }
            };

            console.log(`Sending email from ${emailData.from} to ${emailData.to}...`);

            // Send email
            const result = await transporter.sendMail(mailOptions);

            console.log("Email sent successfully:", {
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
                console.log("Trying next configuration...");
                continue;
            }
        }
    }

    // All attempts failed, throw the last error with enhanced information
    console.error("All SMTP configuration attempts failed");
    
    // Enhanced error handling with specific error types
    if (lastError.code === "EAUTH") {
        throw new Error("SMTP Authentication failed. Please check your email credentials. For Gmail, you may need to use an App Password instead of your regular password.");
    } else if (lastError.code === "ECONNECTION" || lastError.code === "ENOTFOUND") {
        throw new Error("Failed to connect to SMTP server. Please check your internet connection and email provider settings.");
    } else if (lastError.code === "ETIMEDOUT") {
        throw new Error("SMTP connection timed out. Please try again or check your firewall settings.");
    } else if (lastError.responseCode === 550) {
        throw new Error("Recipient email address was rejected by the server.");
    } else if (lastError.responseCode === 554) {
        throw new Error("Email rejected due to policy reasons. Please check the content.");
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
        console.log("SMTP connection test successful for:", email);
        return true;
    } catch (error) {
        console.error("SMTP connection test failed for:", email, error.message);
        return false;
    }
}

module.exports = {
    sendEmail,
    testSMTPConnection
};
