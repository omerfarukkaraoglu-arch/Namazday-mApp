'use server';

import { prisma } from '@/lib/db';
import { getUserContext } from '@/lib/auth-server';

export async function getFilterOptions() {
  const user = await getUserContext();
  if (!user) return { students: [], classes: [], levels: [], prayerTimes: [] };

  const [students, classes, levels, prayerTimes] = await Promise.all([
    prisma.student.findMany({ 
      where: { institutionId: user.institutionId },
      select: { id: true, fullName: true, studentNo: true, class: { select: { name: true } } }, 
      orderBy: { fullName: 'asc' } 
    }),
    prisma.class.findMany({ 
      where: { institutionId: user.institutionId },
      select: { id: true, name: true }, 
      orderBy: { sortOrder: 'asc' } 
    }),
    prisma.level.findMany({ 
      where: { institutionId: user.institutionId },
      select: { id: true, name: true }, 
      orderBy: { sortOrder: 'asc' } 
    }),
    prisma.prayerTime.findMany({ 
      where: { institutionId: user.institutionId },
      select: { id: true, name: true }, 
      orderBy: { sortOrder: 'asc' } 
    })
  ]);

  return { students, classes, levels, prayerTimes };
}

export async function getReportStats(filters: {
  startDate?: string;
  endDate?: string;
  studentId?: string;
  classId?: string;
  levelId?: string;
  prayerTimeId?: string;
} = {}) {
  const user = await getUserContext();
  if (!user) return { pieData: [], trendData: [], totalRecords: 0, records: [] };

  const whereClause: any = { institutionId: user.institutionId };

  if (filters.startDate || filters.endDate) {
    whereClause.date = {};
    if (filters.startDate) {
      const s = new Date(filters.startDate);
      s.setHours(0, 0, 0, 0);
      whereClause.date.gte = s;
    }
    if (filters.endDate) {
      const e = new Date(filters.endDate);
      e.setHours(23, 59, 59, 999);
      whereClause.date.lte = e;
    }
  }

  if (filters.studentId) {
    whereClause.studentId = filters.studentId;
  } else {
    // If specific student not selected, apply class/level filters
    const studentFilter: any = { institutionId: user.institutionId };
    if (filters.classId) studentFilter.classId = filters.classId;
    if (filters.levelId) studentFilter.levelId = filters.levelId;
    
    if (Object.keys(studentFilter).length > 1) {
      whereClause.student = studentFilter;
    }
  }
  
  if (filters.prayerTimeId) whereClause.prayerTimeId = filters.prayerTimeId;

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      student: { select: { id: true, fullName: true, studentNo: true, class: true } },
      prayerTime: { select: { id: true, name: true } }
    },
    orderBy: { date: 'desc' }
  });

  // Genel Durum Dağılımı
  const statusCounts = {
    VAR: 0,
    YOK: 0,
    GEC: 0,
    IZINLI: 0,
    GOREVLI: 0
  };

  attendances.forEach(a => {
    if (statusCounts[a.status as keyof typeof statusCounts] !== undefined) {
      statusCounts[a.status as keyof typeof statusCounts]++;
    }
  });

  const pieData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key as keyof typeof statusCounts]
  })).filter(item => item.value > 0);

  const limit = 7; 
  const uniqueDates = Array.from(new Set(attendances.map(a => new Date(a.date).toISOString().split('T')[0])))
    .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-limit); 

  const trendData = uniqueDates.map(dateStr => {
    const dailyRecords = attendances.filter(a => {
      const recordDateStr = new Date(a.date).toISOString().split('T')[0];
      return recordDateStr === dateStr;
    });

    const d = new Date(dateStr);
    return {
      date: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(d),
      VAR: dailyRecords.filter(a => a.status === 'VAR').length,
      YOK: dailyRecords.filter(a => a.status === 'YOK').length,
    };
  });

  return {
    pieData,
    trendData,
    totalRecords: attendances.length,
    records: attendances
  };
}

export async function getDashboardStats() {
  const user = await getUserContext();
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0,0,0,0);

  const [
    totalStudents, 
    totalAttendanceToday, 
    todayYoks, 
    allLevels, 
    weeklyAttendances
  ] = await Promise.all([
    prisma.student.count({ where: { institutionId: user.institutionId, isActive: true } }),
    prisma.attendance.count({ where: { institutionId: user.institutionId, date: { gte: today } } }),
    prisma.attendance.findMany({
      where: { institutionId: user.institutionId, date: { gte: today }, status: 'YOK' },
      include: { student: { select: { fullName: true, id: true } }, prayerTime: { select: { name: true } } }
    }),
    prisma.level.findMany({ 
      where: { institutionId: user.institutionId },
      include: { students: { select: { id: true } } }
    }),
    prisma.attendance.findMany({
      where: { institutionId: user.institutionId, date: { gte: sevenDaysAgo }, status: 'VAR' },
      include: { 
        student: { select: { fullName: true, id: true, class: { select: { name: true } }, level: { select: { name: true } } } },
      }
    })
  ]);

  // Bugünk En Çok Gelmeyen (Spotlight)
  const yokCounts: Record<string, { name: string, prayerTimes: string[], count: number }> = {};
  todayYoks.forEach(y => {
    if (!yokCounts[y.studentId]) {
      yokCounts[y.studentId] = { name: y.student.fullName, prayerTimes: [], count: 0 };
    }
    yokCounts[y.studentId].prayerTimes.push(y.prayerTime.name);
    yokCounts[y.studentId].count++;
  });

  const topAbsentee = Object.values(yokCounts).sort((a,b) => b.count - a.count)[0] || null;

  // Başarılı Seviyeler (Bugün)
  // Bir seviyenin başarılı olması için en az 1 yoklama kaydı olmalı ve hiç YOK olmamalı.
  const successfulLevels: string[] = [];
  const todayAllAttendances = await prisma.attendance.findMany({
    where: { institutionId: user.institutionId, date: { gte: today } },
    select: { student: { select: { levelId: true } }, status: true }
  });

  allLevels.forEach(level => {
    const levelAttendance = todayAllAttendances.filter(a => a.student.levelId === level.id);
    if (levelAttendance.length > 0 && !levelAttendance.find(a => a.status === 'YOK')) {
      successfulLevels.push(level.name);
    }
  });

  // Haftalık Enler (Weekly Champions)
  const weeklyStudentCounts: Record<string, { name: string, count: number }> = {};
  const weeklyClassCounts: Record<string, { name: string, count: number }> = {};
  const weeklyLevelCounts: Record<string, { name: string, count: number }> = {};

  weeklyAttendances.forEach(a => {
    // Student
    if (!weeklyStudentCounts[a.studentId]) weeklyStudentCounts[a.studentId] = { name: a.student.fullName, count: 0 };
    weeklyStudentCounts[a.studentId].count++;

    // Class
    const className = a.student.class?.name || 'Bilinmiyor';
    if (!weeklyClassCounts[className]) weeklyClassCounts[className] = { name: className, count: 0 };
    weeklyClassCounts[className].count++;

    // Level
    const levelName = a.student.level?.name || 'Bilinmiyor';
    if (!weeklyLevelCounts[levelName]) weeklyLevelCounts[levelName] = { name: levelName, count: 0 };
    weeklyLevelCounts[levelName].count++;
  });

  const topWeeklyStudent = Object.values(weeklyStudentCounts).sort((a,b) => b.count - a.count)[0] || null;
  const topWeeklyClass = Object.values(weeklyClassCounts).sort((a,b) => b.count - a.count)[0] || null;
  const topWeeklyLevel = Object.values(weeklyLevelCounts).sort((a,b) => b.count - a.count)[0] || null;

  // Son 5 yoklama kaydı
  const recentAttendances = await prisma.attendance.findMany({
    where: { institutionId: user.institutionId },
    include: {
      student: { select: { fullName: true } },
      prayerTime: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return {
    totalStudents,
    attendanceToday: totalAttendanceToday,
    recentAttendances,
    attentionNeededStudent: topAbsentee,
    fullAttendance: totalAttendanceToday > 0 && todayYoks.length === 0,
    successfulLevels,
    topWeeklyStudent,
    topWeeklyClass,
    topWeeklyLevel
  };
}
