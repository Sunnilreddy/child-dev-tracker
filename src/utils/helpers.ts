import { WeeklyProgress } from '../types';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getWeeklyProgress(
  completedDates: string[]
): WeeklyProgress[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const count = completedDates.filter(
      (d) => new Date(d).toDateString() === dateStr
    ).length;

    return {
      day: days[date.getDay()],
      shortDay: shortDays[date.getDay()],
      count,
    };
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getProgressPercent(points: number, maxPoints: number): number {
  return clamp(Math.round((points / maxPoints) * 100), 0, 100);
}

export function getChildAgeLabel(birthDateIso: string): string {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} years old`;
  return `${years}y ${remainingMonths}m`;
}

export function difficultyLabel(d: string): string {
  return { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced' }[d] ?? d;
}
