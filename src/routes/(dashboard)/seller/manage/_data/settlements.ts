export type SettlementPeriod = 'daily' | 'weekly' | 'monthly';

export interface SettlementSummary {
  id: string;
  title: string;
  period: SettlementPeriod;
  amount: number;
  sales: number;
  commission: number;
  settledAt: string;
}

export const SETTLEMENTS: SettlementSummary[] = [
  {
    id: 'stl-20250928',
    title: '9월 28일 정산 내역',
    period: 'daily',
    amount: 245300,
    sales: 310000,
    commission: 64700,
    settledAt: '2025-09-28',
  },
  {
    id: 'stl-202509-W04',
    title: '9월 4주차 정산 내역',
    period: 'weekly',
    amount: 1584300,
    sales: 1890000,
    commission: 305700,
    settledAt: '2025-09-25',
  },
  {
    id: 'stl-202509',
    title: '9월 월간 정산 내역',
    period: 'monthly',
    amount: 6124800,
    sales: 7250000,
    commission: 1125200,
    settledAt: '2025-09-30',
  },
];

export function getSettlementById(id: string) {
  return SETTLEMENTS.find((settlement) => settlement.id === id);
}
