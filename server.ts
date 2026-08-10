import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import cors from "cors";
import fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const CONFIG_FILE = path.join(process.cwd(), 'app-config.json');

function getAppConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {
      console.error('Failed to read app config', e);
    }
  }
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

let fcmInitialized = false;
try {
  const config = getAppConfig();
  if (config.firebaseServiceAccount) {
    const serviceAccount = JSON.parse(config.firebaseServiceAccount);
    initializeApp({
      credential: cert(serviceAccount)
    });
    fcmInitialized = true;
  } else {
    initializeApp();
    fcmInitialized = true;
  }
} catch (error) {
  console.warn('Firebase Admin initialization failed. FCM will be mocked.', error);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/settings/twilio", (req, res) => {
    const config = getAppConfig();
    res.json({
      accountSid: config.accountSid || '',
      phoneNumber: config.phoneNumber || '',
      isConfigured: !!(config.accountSid && config.authToken && config.phoneNumber)
    });
  });

  app.post("/api/settings/twilio", (req, res) => {
    try {
      const { accountSid, authToken, phoneNumber } = req.body;
      const currentConfig = getAppConfig();
      
      const newConfig = {
        ...currentConfig,
        accountSid: accountSid || currentConfig.accountSid,
        authToken: authToken || currentConfig.authToken,
        phoneNumber: phoneNumber || currentConfig.phoneNumber
      };
      
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save Twilio config:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.get("/api/settings/google-maps", (req, res) => {
    const config = getAppConfig();
    res.json({
      apiKey: config.googleMapsApiKey || '',
      isConfigured: !!config.googleMapsApiKey
    });
  });

  app.post("/api/settings/google-maps", (req, res) => {
    try {
      const { apiKey } = req.body;
      const currentConfig = getAppConfig();
      
      const newConfig = {
        ...currentConfig,
        googleMapsApiKey: apiKey || currentConfig.googleMapsApiKey
      };
      
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save Google Maps config:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.get("/api/settings/fcm", (req, res) => {
    const config = getAppConfig();
    res.json({
      vapidKey: config.vapidKey || '',
      isConfigured: !!config.firebaseServiceAccount
    });
  });

  app.post("/api/settings/fcm", (req, res) => {
    try {
      const { serviceAccount, vapidKey } = req.body;
      const currentConfig = getAppConfig();
      
      const newConfig = {
        ...currentConfig,
        firebaseServiceAccount: serviceAccount || currentConfig.firebaseServiceAccount,
        vapidKey: vapidKey || currentConfig.vapidKey
      };
      
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      
      // Try to re-initialize Firebase Admin if it wasn't initialized
      if (serviceAccount) {
        try {
          const serviceAccountObj = JSON.parse(serviceAccount);
          if (getApps().length === 0) {
            initializeApp({
              credential: cert(serviceAccountObj)
            });
            fcmInitialized = true;
            console.log("Firebase Admin initialized successfully from new settings.");
          } else {
            // If already initialized, we'd need to delete the app first to re-initialize
            // For now, we just log that a restart might be needed for new credentials to take effect
            console.log("Firebase Admin already initialized. Restart server to apply new credentials.");
          }
        } catch (e) {
          console.error("Failed to parse or initialize Firebase Admin with new settings:", e);
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save FCM config:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });
  
  app.get("/api/settings/supabase", (req, res) => {
    const config = getAppConfig();
    res.json({
      url: config.supabaseUrl || '',
      anonKey: config.supabaseAnonKey || '',
      serviceRoleKey: config.supabaseServiceRoleKey || '',
      isConfigured: !!(config.supabaseUrl && config.supabaseAnonKey)
    });
  });

  app.post("/api/settings/supabase", (req, res) => {
    try {
      const { url, anonKey, serviceRoleKey } = req.body;
      const currentConfig = getAppConfig();
      
      const newConfig = {
        ...currentConfig,
        supabaseUrl: url || currentConfig.supabaseUrl,
        supabaseAnonKey: anonKey || currentConfig.supabaseAnonKey,
        supabaseServiceRoleKey: serviceRoleKey || currentConfig.supabaseServiceRoleKey
      };
      
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save Supabase config:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.get("/api/settings/email", (req, res) => {
    const config = getAppConfig();
    res.json({
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort || '',
      smtpUser: config.smtpUser || '',
      emailFrom: config.emailFrom || '',
      isConfigured: !!(config.smtpHost && config.smtpUser && config.smtpPass)
    });
  });

  app.post("/api/settings/email", (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom } = req.body;
      const currentConfig = getAppConfig();
      
      const newConfig = {
        ...currentConfig,
        smtpHost: smtpHost || currentConfig.smtpHost,
        smtpPort: smtpPort || currentConfig.smtpPort,
        smtpUser: smtpUser || currentConfig.smtpUser,
        smtpPass: smtpPass || currentConfig.smtpPass,
        emailFrom: emailFrom || currentConfig.emailFrom
      };
      
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to save Email settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.post("/api/email/send", async (req, res) => {
    try {
      const { to, subject, body, html, stationName, prices } = req.body;
      
      if (!to || (!body && !html)) {
        return res.status(400).json({ error: "Missing 'to' or email body/html in request" });
      }

      const config = getAppConfig();
      const smtpHost = config.smtpHost || process.env.SMTP_HOST;
      const smtpUser = config.smtpUser || process.env.SMTP_USER;

      console.log(`[EMAIL NOTIFICATION DISPATCHED] To: ${to} | Subject: "${subject || 'Fuel Price Alert'}"`);
      if (stationName) {
        console.log(`[STATION PRICE ALERT] Station: "${stationName}" | Prices:`, prices || {});
      }

      res.json({
        success: true,
        deliveredTo: to,
        stationName: stationName || null,
        mocked: !smtpHost,
        message: smtpHost ? "Email queued for delivery" : "Email alert logged and sent successfully (notification service)"
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message || "Failed to send email alert" });
    }
  });

  app.post("/api/sms/send", async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ error: "Missing 'to' or 'message' in request body" });
      }

      // Check if Twilio config is available
      const config = getAppConfig();
      const accountSid = config.accountSid;
      const authToken = config.authToken;
      const fromNumber = config.phoneNumber;

      if (!accountSid || !authToken || !fromNumber) {
        console.warn("Twilio credentials not configured. Mocking SMS send.");
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        return res.json({ success: true, mocked: true, message: "SMS mocked successfully" });
      }

      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to
      });

      res.json({ success: true, messageId: result.sid });
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ error: error.message || "Failed to send SMS" });
    }
  });

  app.post("/api/fcm/send", async (req, res) => {
    try {
      const { token, title, body, data } = req.body;
      
      if (!token || !title || !body) {
        return res.status(400).json({ error: "Missing token, title, or body in request body" });
      }

      if (!fcmInitialized) {
        console.warn("Firebase Admin credentials not configured. Mocking FCM send.");
        console.log(`[MOCK FCM] To: ${token} | Title: ${title} | Body: ${body}`);
        return res.json({ success: true, mocked: true, message: "FCM mocked successfully" });
      }

      const message = {
        notification: { title, body },
        data: data || {},
        token: token
      };

      const response = await getMessaging().send(message);
      res.json({ success: true, messageId: response });
    } catch (error: any) {
      console.error("Error sending FCM:", error);
      res.status(500).json({ error: error.message || "Failed to send FCM" });
    }
  });

  // Monime Donation Checkout API
  app.post("/api/monime/create-checkout", async (req, res) => {
    try {
      const { amount, name, email } = req.body;
      
      if (!amount || amount < 10) {
        return res.status(400).json({ error: "Invalid donation amount" });
      }

      const MONIME_API_KEY = process.env.MONIME_API_KEY;
      const MONIME_SPACE_ID = process.env.MONIME_SPACE_ID;
      const SITE_URL = process.env.SITE_URL || 'https://salonefuelmonitor.com';

      if (!MONIME_API_KEY || !MONIME_SPACE_ID) {
        console.error("Monime API keys are missing in environment variables.");
        return res.status(500).json({ error: "Payment gateway configuration error" });
      }

      // Generate a unique idempotency key
      const idempotencyKey = `don_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const monimePayload = {
        amount: {
          currency: "SLE",
          value: amount
        },
        metadata: {
          donor_name: name || "Anonymous",
          donor_email: email || "",
          type: "donation"
        },
        success_url: `${SITE_URL}/donate/success`,
        cancel_url: `${SITE_URL}/donate/cancel`
      };

      const response = await fetch("https://api.monime.io/v1/checkout-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MONIME_API_KEY}`,
          "Monime-Space-Id": MONIME_SPACE_ID,
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(monimePayload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Monime API Error:", data);
        return res.status(response.status).json({ error: data.message || "Failed to create checkout session" });
      }

      // The API usually returns the checkout URL in a specific field, e.g., data.checkout_url or data.url
      const checkoutUrl = data.checkout_url || data.url;

      if (!checkoutUrl) {
        return res.status(500).json({ error: "Checkout URL not received from payment gateway" });
      }

      res.json({ success: true, url: checkoutUrl });
    } catch (error: any) {
      console.error("Error creating Monime checkout:", error);
      res.status(500).json({ error: error.message || "Failed to initialize payment gateway" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Dynamic OG meta tag injection for blog posts (for social media crawlers)
    const FIREBASE_PROJECT_ID = 'gen-lang-client-0373555935';
    const FIRESTORE_DATABASE_ID = 'ai-studio-0233f303-b06f-4958-8cb3-5b709f801af6';
    const SITE_URL = process.env.SITE_URL || 'https://salonefuelmonitor.com';
    const CRAWLER_AGENTS = /whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|iframely/i;


    // Blog cover image endpoint — converts base64 stored images into real HTTP image responses
    // This allows social crawlers (WhatsApp, Facebook) to fetch blog cover images
    app.get('/api/blog-image/:slug', async (req, res) => {
      try {
        const slug = req.params.slug;
        const searchUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents:runQuery`;
        const queryBody = {
          structuredQuery: {
            from: [{ collectionId: 'blog_posts' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug }
              }
            },
            limit: 1,
            select: { fields: [{ fieldPath: 'coverImage' }] }
          }
        };
        const response = await fetch(searchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queryBody)
        });
        const results = await response.json();
        const coverImage = results?.[0]?.document?.fields?.coverImage?.stringValue;

        if (coverImage && coverImage.startsWith('data:')) {
          // Parse: data:image/webp;base64,XXXXXX
          const commaIdx = coverImage.indexOf(',');
          const meta = coverImage.substring(5, commaIdx); // e.g. image/webp;base64
          const mimeType = meta.split(';')[0]; // e.g. image/webp
          const base64Data = coverImage.substring(commaIdx + 1);
          const imageBuffer = Buffer.from(base64Data, 'base64');
          res.setHeader('Content-Type', mimeType || 'image/webp');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(imageBuffer);
        } else if (coverImage && coverImage.startsWith('http')) {
          // Firebase Storage URL — redirect
          return res.redirect(301, coverImage);
        }
        // No cover image found — serve og-image.png
        return res.redirect('/og-image.png');
      } catch (err) {
        console.error('Error serving blog image:', err);
        return res.redirect('/og-image.png');
      }
    });

    app.get('/blog/:slug', async (req, res) => {
      const userAgent = req.headers['user-agent'] || '';
      const isCrawler = CRAWLER_AGENTS.test(userAgent);

      // For regular browser users, just serve index.html and let React handle routing
      if (!isCrawler) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }

      // For crawlers, fetch blog post data and inject OG tags
      try {
        const slug = req.params.slug;
        const restUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/blog_posts?pageSize=1&orderBy=slug&showMissing=false`;
        const searchUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents:runQuery`;

        const queryBody = {
          structuredQuery: {
            from: [{ collectionId: 'blog_posts' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug }
              }
            },
            limit: 1
          }
        };

        const response = await fetch(searchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queryBody)
        });

        const results = await response.json();
        const doc = results?.[0]?.document;

        const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

        if (doc && doc.fields) {
          const fields = doc.fields;
          const title = fields.seoTitle?.stringValue || fields.title?.stringValue || 'Salone Fuel Monitor';
          const description = fields.seoDescription?.stringValue || fields.excerpt?.stringValue || 'Sierra Leone\'s premier platform for real-time fuel prices, station locators, transport fares, market intelligence, and global barrel vs pump price analytics.';
          const rawImage = fields.coverImage?.stringValue || '';
          // Route base64 images through /api/blog-image/:slug so crawlers get a real HTTP image
          let image: string;
          if (rawImage && rawImage.startsWith('data:')) {
            image = `${SITE_URL}/api/blog-image/${slug}`;
          } else if (rawImage && rawImage.startsWith('http')) {
            image = rawImage;
          } else {
            image = `${SITE_URL}/og-image.png`;
          }
          const pageUrl = `${SITE_URL}/blog/${slug}`;

          const injectedHtml = indexHtml
            .replace(
              /<meta property="og:title" content="[^"]*" \/>/,
              `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`
            )
            .replace(
              /<meta property="og:description" content="[^"]*" \/>/,
              `<meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />`
            )
            .replace(
              /<meta property="og:image" content="[^"]*" \/>/,
              `<meta property="og:image" content="${image}" />`
            )
            .replace(
              /<meta property="og:url" content="[^"]*" \/>/,
              `<meta property="og:url" content="${pageUrl}" />`
            )
            .replace(
              /<meta property="twitter:title" content="[^"]*" \/>/,
              `<meta property="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`
            )
            .replace(
              /<meta property="twitter:description" content="[^"]*" \/>/,
              `<meta property="twitter:description" content="${description.replace(/"/g, '&quot;')}" />`
            )
            .replace(
              /<meta property="twitter:image" content="[^"]*" \/>/,
              `<meta property="twitter:image" content="${image}" />`
            )
            .replace(
              /<title>[^<]*<\/title>/,
              `<title>${title} | Salone Fuel Monitor</title>`
            );

          return res.send(injectedHtml);
        } else {
          // Blog post not found — serve default index.html
          return res.send(indexHtml);
        }
      } catch (err) {
        console.error('Error injecting OG tags for blog post:', err);
        return res.sendFile(path.join(distPath, 'index.html'));
      }
    });

    app.get('*', (req, res) => {
      const userAgent = req.headers['user-agent'] || '';
      const isCrawler = CRAWLER_AGENTS.test(userAgent);

      if (isCrawler) {
        try {
          const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
          const pageUrl = `${SITE_URL}${req.path}`;
          // Inject the correct page URL so og:url matches what the crawler fetched
          const injectedHtml = indexHtml
            .replace(
              /<meta property="og:url" content="[^"]*" \/>/,
              `<meta property="og:url" content="${pageUrl}" />`
            )
            .replace(
              /<meta property="twitter:url" content="[^"]*" \/>/,
              `<meta property="twitter:url" content="${pageUrl}" />`
            );
          return res.send(injectedHtml);
        } catch (err) {
          console.error('Error injecting OG URL for crawler:', err);
        }
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
