import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOneSignalPush } from '@/lib/onesignal-server';

export async function GET(request: Request) {
  // Vercel Cron Authentication
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Türkiye saatine (UTC+3) göre mevcut zamanı hesapla
    const now = new Date();
    const utcHours = now.getUTCHours();
    const trHours = (utcHours + 3) % 24;
    const currentMinutes = now.getUTCMinutes();
    const timeInMinutes = trHours * 60 + currentMinutes;

    const institutions = await prisma.institution.findMany({
      where: { isActive: true },
      include: {
        prayerTimes: { where: { isActive: true } }
      }
    });

    let notificationsSent = 0;

    for (const inst of institutions) {
      // 1. Gün Sonu Raporu (Saat 22:00)
      if (trHours === 22 && currentMinutes < 15) { // 22:00 - 22:15 arası bir kez
        const admins = await prisma.user.findMany({
          where: { institutionId: inst.id, role: { in: ['admin', 'SUPER_ADMIN'] }, isActive: true }
        });

        // Bugünün devamsızlık sayısını bul (Basit bir rapor)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const admin of admins) {
          try {
            await sendOneSignalPush([admin.id], 'Gün Sonu Raporu', 'Bugünkü yoklama raporlarına ve devamsızlıklara göz atabilirsiniz.', '/raporlar');
            notificationsSent++;
          } catch (e) {}
        }
      }

      // Vakit kontrollü bildirimler
      for (const pt of inst.prayerTimes) {
        if (!pt.startTime || !pt.endTime) continue;

        const startMins = getMinutes(pt.startTime);
        const endMins = getMinutes(pt.endTime);

        // "Yoklamayı Unutma" - Vaktin başlamasına 15 dakika kala (10-20 dk arası)
        if (timeInMinutes >= startMins - 15 && timeInMinutes < startMins - 5) {
          const yoklamacilar = await prisma.user.findMany({
            where: { institutionId: inst.id, role: 'YOKLAMACI', isActive: true }
          });
          for (const y of yoklamacilar) {
            try {
              await sendOneSignalPush([y.id], 'Yoklama Vakti Yaklaşıyor', `${pt.name} vakti için yoklama almayı unutmayın.`, '/yoklama');
              notificationsSent++;
            } catch (e) {}
          }
        }

        // "Yoklamaları Aldınız mı?" - Vakit bittikten 15 dakika sonra
        if (timeInMinutes >= endMins + 15 && timeInMinutes < endMins + 25) {
          const adminsAndYoklamacilar = await prisma.user.findMany({
            where: { institutionId: inst.id, isActive: true }
          });
          for (const u of adminsAndYoklamacilar) {
            try {
              await sendOneSignalPush([u.id], 'Vakit Sona Erdi', `${pt.name} vakti sona erdi. Alınmayan yoklamalarınız varsa lütfen tamamlayın.`, '/yoklama');
              notificationsSent++;
            } catch (e) {}
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: `Cron executed. ${notificationsSent} notifications pushed.` });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
