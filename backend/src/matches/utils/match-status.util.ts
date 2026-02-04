import type { Match } from '../../db/schema';
import { MATCH_STATUS } from '../dtos/create-match.dto';

export function getMatchStatus(
  startTime: Date,
  endTime: Date,
  now = new Date()
) {
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return null;
  }

  if (now < startTime) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= endTime) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

type ValueOf<T> = T[keyof T];

export async function syncMatchStatus(
  match: Match,
  updateStatus: (input: string) => Promise<void>
) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }

  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}
