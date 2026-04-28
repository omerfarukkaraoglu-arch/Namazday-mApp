export const ONESIGNAL_APP_ID = "68d859c0-49f7-4504-ab5a-f78323bd2a9a";

export async function sendOneSignalPush(userIds: string[], title: string, message: string, targetUrl: string = '/dashboard') {
  if (!process.env.ONESIGNAL_REST_API_KEY) {
    console.warn("ONESIGNAL_REST_API_KEY is not set in environment variables. Push skipped.");
    return;
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: {
          external_id: userIds
        },
        headings: { en: title, tr: title },
        contents: { en: message, tr: message },
        url: targetUrl
      })
    });

    const data = await response.json();
    console.log("OneSignal push result:", data);
    return data;
  } catch (error) {
    console.error("OneSignal push error:", error);
  }
}
