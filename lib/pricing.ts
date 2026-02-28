import { addDays, differenceInCalendarDays, getDay } from 'date-fns';

type PriceInput = {
  checkIn: Date;
  checkOut: Date;
  baseNightly: number;
  weekendNightly?: number | null;
  cleaningFee?: number;
  depositFee?: number;
};

export type PriceBreakdown = {
  nights: number;
  nightlyTotal: number;
  cleaningFee: number;
  depositFee: number;
  total: number;
};

export function calculatePrice(input: PriceInput): PriceBreakdown {
  const nights = Math.max(0, differenceInCalendarDays(input.checkOut, input.checkIn));
  let nightlyTotal = 0;

  for (let i = 0; i < nights; i++) {
    const date = addDays(input.checkIn, i);
    const day = getDay(date); // 0 Sun ... 6 Sat
    const isWeekend = day === 0 || day === 6;
    const nightly = isWeekend && input.weekendNightly ? input.weekendNightly : input.baseNightly;
    nightlyTotal += nightly;
  }

  const cleaningFee = input.cleaningFee ?? 0;
  const depositFee = input.depositFee ?? 0;
  const total = nightlyTotal + cleaningFee + depositFee;

  return {
    nights,
    nightlyTotal,
    cleaningFee,
    depositFee,
    total,
  };
}

