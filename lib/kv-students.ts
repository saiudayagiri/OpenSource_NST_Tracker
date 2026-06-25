/**
 * lib/kv-students.ts
 *
 * KV-backed student list. Falls back to seeding from data/students.json on first load.
 * Replaces direct file reads in lib/github.ts for admin-managed student lists.
 */

import { kvGet, kvSet } from './kv';
import { readFileSync } from 'fs';
import { join } from 'path';

const KV_KEY = 'students_list';

export interface Student {
  github: string;
  year?: '1st year' | '2nd year' | '3rd year' | '4th year';
  campus?: 'Rishihood' | 'ADYPU' | 'SVYASA';
}

async function seedFromFile(): Promise<Student[]> {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'students.json'), 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const list: Student[] = data
      .map((s: unknown) => {
        if (typeof s === 'string') return { github: s };
        if (typeof s === 'object' && s !== null && typeof (s as Record<string,unknown>).github === 'string')
          return {
            github: (s as Record<string,string>).github,
            year: (s as any).year,
            campus: (s as any).campus,
          };
        return null;
      })
      .filter((s): s is Student => s !== null);
    await kvSet(KV_KEY, list);
    return list;
  } catch {
    return [];
  }
}

export async function getStudentsKV(): Promise<Student[]> {
  const cached = await kvGet<Student[]>(KV_KEY);
  if (cached !== null) return cached;
  return seedFromFile();
}

export async function addStudent(
  github: string,
  year?: '1st year' | '2nd year' | '3rd year' | '4th year',
  campus?: 'Rishihood' | 'ADYPU' | 'SVYASA'
): Promise<{ ok: boolean; message?: string }> {
  const list = await getStudentsKV();
  const lower = github.toLowerCase().trim();
  if (!lower) return { ok: false, message: 'GitHub username cannot be empty' };
  if (list.some((s) => s.github.toLowerCase() === lower))
    return { ok: false, message: `${github} is already in the list` };
  list.push({ github: github.trim(), year, campus });
  await kvSet(KV_KEY, list);
  return { ok: true };
}

export async function updateStudentDetails(
  github: string,
  year?: '1st year' | '2nd year' | '3rd year' | '4th year',
  campus?: 'Rishihood' | 'ADYPU' | 'SVYASA'
): Promise<{ ok: boolean; message?: string }> {
  const list = await getStudentsKV();
  const lower = github.toLowerCase().trim();
  const index = list.findIndex((s) => s.github.toLowerCase() === lower);
  if (index === -1) return { ok: false, message: 'Student not found' };
  list[index].year = year;
  list[index].campus = campus;
  await kvSet(KV_KEY, list);
  return { ok: true };
}

export async function removeStudent(github: string): Promise<{ ok: boolean }> {
  const list = await getStudentsKV();
  const updated = list.filter((s) => s.github.toLowerCase() !== github.toLowerCase());
  if (updated.length === list.length) return { ok: false };
  await kvSet(KV_KEY, updated);
  return { ok: true };
}
