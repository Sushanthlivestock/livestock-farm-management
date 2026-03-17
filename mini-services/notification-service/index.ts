import { serve } from "bun";
import nodemailer from "nodemailer";

// Notification settings with multiple recipients support
let settings = {
  // Multiple email recipients
  emails: ["sushantvfx88@gmail.com"],
  // Multiple Telegram recipients (chat IDs)
  telegramChatIds: ["5706291144"],
  telegramBotToken: "8652070033:AAGgxHK8blOL7jlAJULhTtcoGYhov0BMTEo",
  notificationsEnabled: true,
  emailEnabled: true,
  telegramEnabled: true,
};

// Send Telegram message to a single chat
async function sendTelegramToChat(chatId: string, message: string): Promise<boolean> {
  if (!settings.telegramBotToken || !chatId) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error(`Telegram error for chat ${chatId}:`, error);
    return false;
  }
}

// Send Telegram message to ALL chats
async function sendTelegramToAll(message: string): Promise<{ total: number; success: number }> {
  const results = { total: settings.telegramChatIds.length, success: 0 };
  
  for (const chatId of settings.telegramChatIds) {
    const sent = await sendTelegramToChat(chatId, message);
    if (sent) results.success++;
    console.log(`📱 Telegram to ${chatId}: ${sent ? "✅" : "❌"}`);
  }
  
  return results;
}

// Send Email to a single address
async function sendEmailTo(email: string, subject: string, body: string): Promise<boolean> {
  try {
    console.log(`📧 EMAIL to: ${email}`);
    console.log(`   Subject: ${subject}`);
    
    // If email credentials are configured, send actual email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      
      await transporter.sendMail({
        from: `"Livestock Farm" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: body,
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Email error for ${email}:`, error);
    return false;
  }
}

// Send Email to ALL recipients
async function sendEmailToAll(subject: string, body: string): Promise<{ total: number; success: number }> {
  const results = { total: settings.emails.length, success: 0 };
  
  for (const email of settings.emails) {
    const sent = await sendEmailTo(email, subject, body);
    if (sent) results.success++;
  }
  
  return results;
}

// Send notification to ALL enabled channels and recipients
async function sendNotification(title: string, message: string): Promise<{
  email: { total: number; success: number };
  telegram: { total: number; success: number };
}> {
  const results = {
    email: { total: 0, success: 0 },
    telegram: { total: 0, success: 0 },
  };

  const fullMessage = `🐄 <b>${title}</b>\n\n${message}\n\n<i>— Integrated Livestock Farm System</i>`;
  const htmlBody = `<h2>🐄 ${title}</h2><p>${message}</p><hr><p><em>— Integrated Livestock Farm System</em></p>`;

  if (settings.emailEnabled && settings.emails.length > 0) {
    results.email = await sendEmailToAll(`🐄 ${title}`, htmlBody);
  }

  if (settings.telegramEnabled && settings.telegramChatIds.length > 0) {
    results.telegram = await sendTelegramToAll(fullMessage);
  }

  return results;
}

// HTTP Server
const server = serve({
  port: 3002,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // GET settings (hide sensitive data)
    if (path === "/api/settings" && req.method === "GET") {
      return Response.json(
        {
          emails: settings.emails,
          telegramChatIds: settings.telegramChatIds,
          telegramBotToken: settings.telegramBotToken ? "configured" : "",
          notificationsEnabled: settings.notificationsEnabled,
          emailEnabled: settings.emailEnabled,
          telegramEnabled: settings.telegramEnabled,
        },
        { headers: corsHeaders }
      );
    }

    // UPDATE settings
    if (path === "/api/settings" && req.method === "POST") {
      try {
        const body = await req.json();
        settings = { ...settings, ...body };
        return Response.json({ success: true, settings }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
      }
    }

    // ADD email recipient
    if (path === "/api/recipients/email" && req.method === "POST") {
      try {
        const body = await req.json();
        const { email } = body;
        
        if (!email || !email.includes("@")) {
          return Response.json({ error: "Valid email required" }, { status: 400, headers: corsHeaders });
        }
        
        if (settings.emails.includes(email)) {
          return Response.json({ error: "Email already exists" }, { status: 400, headers: corsHeaders });
        }
        
        settings.emails.push(email);
        return Response.json({ success: true, emails: settings.emails }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
      }
    }

    // REMOVE email recipient
    if (path === "/api/recipients/email" && req.method === "DELETE") {
      try {
        const body = await req.json();
        const { email } = body;
        
        settings.emails = settings.emails.filter(e => e !== email);
        return Response.json({ success: true, emails: settings.emails }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
      }
    }

    // ADD Telegram recipient
    if (path === "/api/recipients/telegram" && req.method === "POST") {
      try {
        const body = await req.json();
        const { chatId, name } = body;
        
        if (!chatId) {
          return Response.json({ error: "Chat ID required" }, { status: 400, headers: corsHeaders });
        }
        
        if (settings.telegramChatIds.includes(chatId)) {
          return Response.json({ error: "Chat ID already exists" }, { status: 400, headers: corsHeaders });
        }
        
        settings.telegramChatIds.push(chatId);
        return Response.json({ success: true, chatIds: settings.telegramChatIds }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
      }
    }

    // REMOVE Telegram recipient
    if (path === "/api/recipients/telegram" && req.method === "DELETE") {
      try {
        const body = await req.json();
        const { chatId } = body;
        
        settings.telegramChatIds = settings.telegramChatIds.filter(id => id !== chatId);
        return Response.json({ success: true, chatIds: settings.telegramChatIds }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });
      }
    }

    // GET all recipients
    if (path === "/api/recipients" && req.method === "GET") {
      return Response.json(
        {
          emails: settings.emails,
          telegramChatIds: settings.telegramChatIds,
        },
        { headers: corsHeaders }
      );
    }

    // SEND test notification
    if (path === "/api/send-test" && req.method === "POST") {
      try {
        const result = await sendNotification(
          "Test Notification 🧪",
          `This is a test notification.\n\nRecipients:\n• Emails: ${settings.emails.length}\n• Telegram: ${settings.telegramChatIds.length}\n\nAll recipients should receive this message! 🎉`
        );
        return Response.json({ success: true, results: result }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Failed to send notification" }, { status: 500, headers: corsHeaders });
      }
    }

    // SEND alert notification
    if (path === "/api/send-alert" && req.method === "POST") {
      try {
        const body = await req.json();
        const { title, message } = body;
        
        if (!title || !message) {
          return Response.json({ error: "Title and message required" }, { status: 400, headers: corsHeaders });
        }

        const result = await sendNotification(title, message);
        return Response.json({ success: true, results: result }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Failed to send alert" }, { status: 500, headers: corsHeaders });
      }
    }

    // SEND animal alert
    if (path === "/api/animal-alert" && req.method === "POST") {
      try {
        const body = await req.json();
        const { animalTag, animalName, alertType, details } = body;
        
        const emoji = alertType === "sick" ? "🚨" : alertType === "pregnant" ? "🤰" : "⚠️";
        const title = `${emoji} Animal Alert: ${alertType.toUpperCase()}`;
        const message = `<b>Tag:</b> ${animalTag}\n<b>Name:</b> ${animalName || "N/A"}\n<b>Details:</b> ${details}`;

        const result = await sendNotification(title, message);
        return Response.json({ success: true, results: result }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Failed to send animal alert" }, { status: 500, headers: corsHeaders });
      }
    }

    // SEND daily summary
    if (path === "/api/daily-summary" && req.method === "POST") {
      try {
        const body = await req.json();
        const { totalGoats, totalPigs, healthyCount, sickCount, pregnantCount, upcomingBirths } = body;
        
        const title = "📊 Daily Farm Summary";
        const message = `
<b>📈 Farm Statistics:</b>
• Total Animals: ${totalGoats + totalPigs}
• Goats: ${totalGoats} | Pigs: ${totalPigs}
• Healthy: ${healthyCount} ✅
• Sick: ${sickCount} 🏥
• Pregnant: ${pregnantCount} 🤰

<b>📅 Upcoming Births:</b> ${upcomingBirths}

<i>Have a great day! 🌅</i>
        `.trim();

        const result = await sendNotification(title, message);
        return Response.json({ success: true, results: result }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: "Failed to send summary" }, { status: 500, headers: corsHeaders });
      }
    }

    // Health check
    if (path === "/health") {
      return Response.json({ 
        status: "ok", 
        service: "notification-service",
        recipients: {
          emails: settings.emails.length,
          telegram: settings.telegramChatIds.length,
        }
      }, { headers: corsHeaders });
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  },
});

console.log("🔔 Notification Service running on port 3002");
console.log(`📧 Email recipients: ${settings.emails.length}`);
console.log(`📱 Telegram recipients: ${settings.telegramChatIds.length}`);
