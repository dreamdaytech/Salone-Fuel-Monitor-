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
  const PORT = 3000;

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
