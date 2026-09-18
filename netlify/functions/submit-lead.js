export default async (request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers
    });
  }

  try {
    const data = await request.json();
    const clean = (value, fallback = "Не указано") => {
      const text = String(value ?? "").trim();
      return text || fallback;
    };

    const name = clean(data.name);
    const phone = clean(data.phone);
    const location = clean(data.location);
    const date = clean(data.date);
    const duration = clean(data.duration);
    const payment = clean(data.payment);
    const service = clean(data.service);
    const comment = clean(data.comment, "Без комментария");
    const createdAt = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
      dateStyle: "short",
      timeStyle: "short"
    });

    const text = [
      "🆕 <b>НОВАЯ ЗАЯВКА — КомпрессорПро</b>",
      "",
      `👤 <b>Клиент:</b> ${escapeHtml(name)}`,
      `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
      `📍 <b>Объект:</b> ${escapeHtml(location)}`,
      `📅 <b>Подача:</b> ${escapeHtml(date)}`,
      `⏱ <b>Длительность:</b> ${escapeHtml(duration)}`,
      `💳 <b>Оплата:</b> ${escapeHtml(payment)}`,
      `🛠 <b>Услуга:</b> ${escapeHtml(service)}`,
      `📝 <b>Комментарий:</b> ${escapeHtml(comment)}`,
      "",
      "🌐 <i>Источник: сайт КомпрессорПро</i>",
      `🕒 <i>${createdAt} (МСК)</i>`
    ].join("\n");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Telegram environment variables are not configured");
      return new Response(JSON.stringify({ ok: false, error: "Server is not configured" }), {
        status: 500,
        headers
      });
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API error", telegramResult);
      return new Response(JSON.stringify({ ok: false, error: "Telegram delivery failed" }), {
        status: 502,
        headers
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (error) {
    console.error("Lead submission error", error);
    return new Response(JSON.stringify({ ok: false, error: "Invalid request" }), {
      status: 400,
      headers
    });
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
