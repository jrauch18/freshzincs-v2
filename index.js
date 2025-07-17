// ~/freshzincs/index.js

const express = require('express');
const fs      = require('fs');
const http    = require('http');
const https   = require('https');
const path    = require('path');
const AWS     = require('aws-sdk');

const app = express();
const HTTP_PORT  = 80;
const HTTPS_PORT = 443;

// ---- MIDDLEWARE ----

// Serve everything under public/ as static assets
app.use( express.static(path.join(__dirname, 'public')) );

// JSON body parsing for your API
app.use(express.json());


// ---- CLEAN URL ROUTES ----

// Home page (formerly home.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});


// ---- CONTACT FORM API via AWS SES ----

// Ensure your EC2 IAM role has SES:SendEmail permissions
AWS.config.update({ region: 'us-east-1' });
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const params = {
    Source:            'no-reply@freshzincs.com',
    Destination:       { ToAddresses: ['sam@ssr-technologies.com'] },
    ReplyToAddresses:  [ email ],
    Message: {
      Subject: { Data: `New inquiry from ${name}` },
      Body: {
        Text: {
          Data:
            `Name: ${name}\n` +
            `Email: ${email}\n\n` +
            `${message}`
        }
      }
    }
  };

  try {
    await ses.sendEmail(params).promise();
    res.json({ success: true });
  } catch (err) {
    console.error('SES error:', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});


// ---- HTTPS SERVER SETUP ----

const sslOptions = {
  key:  fs.readFileSync('/home/ec2-user/ssl/freshzincs/privkey.pem'),
  cert: fs.readFileSync('/home/ec2-user/ssl/freshzincs/fullchain.pem'),
};

// Redirect any plain‐HTTP requests to HTTPS
const redirectApp = express();
redirectApp.use((req, res) => {
  const host = req.headers.host.replace(/:\d+$/, `:${HTTPS_PORT}`);
  res.redirect(301, `https://${host}${req.url}`);
});
http.createServer(redirectApp)
    .listen(HTTP_PORT, () => {
      console.log(`🔄 HTTP on ${HTTP_PORT} → redirecting to HTTPS`);
    });

// Launch the secure server
https.createServer(sslOptions, app)
     .listen(HTTPS_PORT, () => {
       console.log(`🔒 HTTPS listening on port ${HTTPS_PORT}`);
     });
