import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface Kid {
  id: string;
  name: string;
  calendarId: string;
  colorId: string;
  colorHex: string;
}

export async function getKids(userId: string): Promise<Kid[]> {
  const kids = await redis.get<Kid[]>(`kids:${userId}`);
  return kids ?? [];
}

export async function saveKids(userId: string, kids: Kid[]): Promise<void> {
  await redis.set(`kids:${userId}`, kids);
}

export async function getPendingText(token: string): Promise<string | null> {
  return redis.get<string>(`pending:${token}`);
}

export async function setPendingText(token: string, text: string): Promise<void> {
  await redis.set(`pending:${token}`, text, { ex: 600 });
}

export async function deletePendingText(token: string): Promise<void> {
  await redis.del(`pending:${token}`);
}
