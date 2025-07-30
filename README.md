# Vidpace Email Sender - Backend

This is the backend component of the Vidpace Email Sender application, designed to be deployed on Vercel as serverless functions.

## Features

- RESTful API for sending emails via SMTP
- Support for multiple email providers (Gmail, Outlook, Yahoo, custom domains)
- Automatic SMTP configuration detection
- Rate limiting and security middleware
- CORS support for cross-origin requests
- Input validation and error handling

## Deployment to Vercel

### Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)

### Steps

1. Navigate to the backend directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project or create new one
   - Choose settings (usually defaults are fine)

5. Note the deployment URL for frontend configuration

### Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from Git repository
4. Select this backend folder
5. Deploy with default settings

## API Endpoints

### POST /api/send-email

Send an email via SMTP.

**Request Body:**
```json
{
  "senderEmail": "your@email.com",
  "senderPassword": "your-password",
  "recipientEmail": "recipient@email.com",
  "recipientName": "Recipient Name",
  "subject": "Email Subject",
  "emailBody": "<p>HTML email content</p>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully!",
  "messageId": "message-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Supported Email Providers

- Gmail (gmail.com)
- Outlook/Hotmail/Live (outlook.com, hotmail.com, live.com)
- Yahoo (yahoo.com, yahoo.co.uk)
- iCloud (icloud.com, me.com)
- Vidpace (vidpace.com)
- Custom domains (automatic detection)

## Security Features

- Rate limiting (10 requests per 15 minutes per IP)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Password masking in logs

## Files

- `api/send-email.js` - Vercel serverless function
- `server/server.js` - Express server (for local development)
- `server/mailer.js` - Email sending logic and SMTP configuration
- `package.json` - Dependencies and scripts
- `vercel.json` - Vercel deployment configuration
- `README.md` - This documentation

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Test the API at `http://localhost:3000`

## Environment Variables

No environment variables are required for basic functionality. All configuration is handled automatically based on email provider detection.

