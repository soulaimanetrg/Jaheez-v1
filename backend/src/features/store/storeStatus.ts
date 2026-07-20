export type ScheduleDay = {
  open: string;
  close: string;
  is_closed: boolean;
};

export type WeeklySchedule = Record<string, ScheduleDay>;

export type ScheduleStatus = {
  isOpen: boolean;
  nextOpening: {
    dayKey: string;
    dayFr: string;
    dayAr: string;
    time: string;
  } | null;
};

const DAY_NAMES_FR: Record<string, string> = {
  mon: 'lundi',
  tue: 'mardi',
  wed: 'mercredi',
  thu: 'jeudi',
  fri: 'vendredi',
  sat: 'samedi',
  sun: 'dimanche'
};

const DAY_NAMES_AR: Record<string, string> = {
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
  sat: 'السبت',
  sun: 'الأحد'
};

const DAYS_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function normalizeOpeningHours(openingHours: any): WeeklySchedule {
  if (!openingHours) {
    return {};
  }

  try {
    if (typeof openingHours === 'string') {
      const trimmed = openingHours.trim();
      if (!trimmed || trimmed === '{}' || trimmed === 'null') {
        return {};
      }

      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }

    return typeof openingHours === 'object' && !Array.isArray(openingHours) ? openingHours : {};
  } catch (e) {
    return {};
  }
}

export function getStoreScheduleStatus(openingHours: any): ScheduleStatus {
  const schedule = normalizeOpeningHours(openingHours);

  // Get current date/time in Morocco timezone (Africa/Casablanca)
  let now: Date;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Casablanca',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const val: Record<string, string> = {};
    parts.forEach(p => { val[p.type] = p.value; });
    
    // Construct local Date object representing Casablanca time
    now = new Date(
      Number(val.year),
      Number(val.month) - 1,
      Number(val.day),
      Number(val.hour),
      Number(val.minute),
      Number(val.second)
    );
  } catch (err) {
    // Fallback to local time if timezone format fails
    now = new Date();
  }

  const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const currentDayKey = DAYS_KEYS[dayIndex];
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;
  
  const todaySchedule = schedule[currentDayKey];
  
  // Helper to parse time string "HH:MM" to minutes
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // 1. Check if open today
  if (todaySchedule && !todaySchedule.is_closed && todaySchedule.open && todaySchedule.close) {
    const openMin = timeToMinutes(todaySchedule.open);
    const closeMin = timeToMinutes(todaySchedule.close);
    
    // Support overnight closing times (e.g. open at 18:00, close at 02:00)
    if (closeMin < openMin) {
      if (currentMinutes >= openMin || currentMinutes < closeMin) {
        return { isOpen: true, nextOpening: null };
      }
    } else {
      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        return { isOpen: true, nextOpening: null };
      }
    }
  }

  // 2. Find next opening time in the next 7 days
  for (let i = 0; i < 7; i++) {
    const nextIndex = (dayIndex + i) % 7;
    const nextDayKey = DAYS_KEYS[nextIndex];
    const nextSchedule = schedule[nextDayKey];
    
    if (nextSchedule && !nextSchedule.is_closed && nextSchedule.open) {
      // If it's today but the opening hour has already passed, skip
      if (i === 0) {
        const openMin = timeToMinutes(nextSchedule.open);
        if (currentMinutes >= openMin) {
          continue;
        }
      }
      
      const dayFr = i === 0 ? "aujourd'hui" : DAY_NAMES_FR[nextDayKey];
      const dayAr = i === 0 ? "اليوم" : DAY_NAMES_AR[nextDayKey];
      
      return {
        isOpen: false,
        nextOpening: {
          dayKey: nextDayKey,
          dayFr,
          dayAr,
          time: nextSchedule.open
        }
      };
    }
  }

  return { isOpen: false, nextOpening: null };
}

export function isStoreCurrentlyOpen(store: any): { isOpen: boolean; labelFr: string; labelAr: string } {
  if (!store || store.is_open === false) {
    return { isOpen: false, labelFr: "Fermé temporairement", labelAr: "مغلق مؤقتاً" };
  }

  
  // If schedule is empty or doesn't exist, default to open
  const schedule = normalizeOpeningHours(store.opening_hours);
  if (Object.keys(schedule).length === 0) {
    return { isOpen: true, labelFr: "Ouvert", labelAr: "مفتوح" };
  }

  const status = getStoreScheduleStatus(schedule);
  if (status.isOpen) {
    return { isOpen: true, labelFr: "Ouvert", labelAr: "مفتوح" };
  }

  if (status.nextOpening) {
    const { dayFr, dayAr, time } = status.nextOpening;
    return {
      isOpen: false,
      labelFr: `Fermé • Ouvre ${dayFr} à ${time}`,
      labelAr: `مغلق • يفتح ${dayAr} في ${time}`
    };
  }

  return { isOpen: false, labelFr: "Fermé", labelAr: "مغلق" };
}
