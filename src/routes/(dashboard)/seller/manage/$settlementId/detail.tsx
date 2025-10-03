import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { SellerHeader } from '../../_components/SellerHeader';
import { FOOTER_ITEMS, STORE_INFO } from '../index';
import { getSettlementById } from '../_data/settlements';

export const Route = createFileRoute('/(dashboard)/seller/manage/$settlementId/detail')({
  loader: ({ params }) => {
    const settlement = getSettlementById(params.settlementId);
    if (!settlement) {
      throw redirect({ to: '/seller/manage', search: { tab: 'settlement' } });
    }
    return { settlement };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { settlement } = Route.useLoaderData();

  const netAmount = settlement.amount;
  const sales = settlement.sales;
  const commission = settlement.commission;

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] text-white'>
      <SellerHeader
        nickname='김사장'
        storeName={STORE_INFO.name}
        address={STORE_INFO.address}
        profileImageUrl=''
        onSettingsClick={() => console.log('seller header settings')}
      />

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 text-[#1b1b1b] outline outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-5 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        <Card className='border-none bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]'>
          <CardContent className='space-y-6 px-4 py-6'>
            <header className='space-y-2'>
              <p className='text-[12px] font-semibold text-[#6b7785]'>{settlement.settledAt}</p>
              <h1 className='text-[1.75rem] font-extrabold text-[#1b1b1b]'>{settlement.title}</h1>
              <p className='text-[13px] text-[#6b7785]'>정산 금액은 매출 합계에서 수수료를 제외한 실제 입금액입니다.</p>
            </header>

            <section className='grid gap-3 rounded-2xl bg-[#f5f7f9] p-4 sm:grid-cols-3'>
              <div className='rounded-xl bg-white px-4 py-3 text-[#1b1b1b] shadow-sm'>
                <p className='text-[12px] font-semibold text-[#6b7785]'>총 매출</p>
                <p className='text-[18px] font-bold'>₩ {sales.toLocaleString()}</p>
              </div>
              <div className='rounded-xl bg-white px-4 py-3 text-[#1b1b1b] shadow-sm'>
                <p className='text-[12px] font-semibold text-[#6b7785]'>수수료</p>
                <p className='text-[18px] font-bold'>₩ {commission.toLocaleString()}</p>
              </div>
              <div className='rounded-xl bg-[#1ba7a1] px-4 py-3 text-white shadow-sm sm:col-span-1'>
                <p className='text-[12px] font-semibold text-white/80'>정산 금액</p>
                <p className='text-[20px] font-extrabold'>₩ {netAmount.toLocaleString()}</p>
              </div>
            </section>

            <div className='flex flex-col gap-2 rounded-2xl bg-[#f5f7f9] px-4 py-4 text-[12px] text-[#475569]'>
              <p>
                정산 내역은 뭐든배달 파트너 센터에서 확인한 매출과 수수료 내역을 기반으로 계산되며, 영업일 기준 1일
                이내에 입금됩니다. 입금 계좌 변경이 필요한 경우 고객센터로 문의해 주세요.
              </p>
              <p>정산 상세 증빙이 필요한 경우 정산 이메일 영수증을 참고해주세요.</p>
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='h-10 flex-1 rounded-full border-[#cbd8e2] text-[13px] font-semibold text-[#1b1b1b] hover:bg-[#f8fafc]'
                onClick={() => window.history.back()}>
                목록으로 돌아가기
              </Button>
              <Button className='h-10 flex-1 rounded-full bg-[#1ba7a1] text-[13px] font-semibold text-white hover:bg-[#17928d]'>
                증빙 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-4 py-4 text-white sm:px-6'>
        <nav className='grid grid-cols-3 gap-2 text-[12px] font-semibold sm:text-[13px]'>
          {FOOTER_ITEMS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type='button'
              className={
                active
                  ? 'flex h-[52px] flex-col items-center justify-center gap-1 rounded-2xl bg-white/15 text-white shadow-inner'
                  : 'flex h-[52px] flex-col items-center justify-center gap-1 rounded-2xl text-white/80 hover:bg-white/10 hover:text-white'
              }>
              <Icon className='size-5' aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}
