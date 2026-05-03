import { formatDistanceToNow, format, isPast, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function getDaysUntilDue(dueDate?: string): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return days;
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return isPast(new Date(dueDate));
}

export function isDueSoon(dueDate?: string, daysThreshold: number = 7): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const soon = addDays(new Date(), daysThreshold);
  return isBefore(due, soon) && !isPast(due);
}

export function getActivityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    assign: 'bg-blue-100 text-blue-800',
    quiz: 'bg-purple-100 text-purple-800',
    forum: 'bg-green-100 text-green-800',
    resource: 'bg-yellow-100 text-yellow-800',
    file: 'bg-gray-100 text-gray-800',
    url: 'bg-indigo-100 text-indigo-800',
    folder: 'bg-orange-100 text-orange-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
