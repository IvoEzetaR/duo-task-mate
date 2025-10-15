import { Task } from "@/types/task";

type TaskRow = {
  privacy: string;
  responsible: string;
  shared_with?: unknown;
};

const getShared = (t: Task | TaskRow): string[] => {
  // Domain object uses sharedWith; DB row uses shared_with(Json)
  const anyT = t as any;
  const sw = anyT.sharedWith ?? anyT.shared_with;
  return Array.isArray(sw) ? sw as string[] : [];
};

export const canUserSeeTask = (t: Task | TaskRow, username?: string | null): boolean => {
  if ((t as any).privacy === 'general') return true;
  if (!username) return false;
  const shared = getShared(t);
  return (t as any).responsible === username || shared.includes(username);
};

export const getTaskAudience = (t: Task): string[] => {
  if (t.privacy === 'general') return [];
  const shared = getShared(t);
  return [t.responsible, ...shared];
};
