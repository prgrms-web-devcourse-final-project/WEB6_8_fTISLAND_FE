import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, BadgeCheck, Bike, Camera, Home, IdCard, MapPin, Store } from 'lucide-react';

export const Route = createFileRoute('/make-profile/')({
  component: RouteComponent,
});

function RouteComponent() {
  const profileOptions = [
    {
      id: 'customer',
      title: '소비자 프로필 생성',
      description: '동네 상점 배송을 요청할 때 필요한 정보를 먼저 등록해 주세요.',
      highlights: [
        { icon: Home, label: '기본 배송지 등록' },
        { icon: Camera, label: '프로필 사진 등록' },
        { icon: BadgeCheck, label: '닉네임 설정' },
        { icon: MapPin, label: '위치 정보 이용 동의' },
      ],
      cta: '소비자 프로필 만들기',
      href: '/make-profile/customer',
      accent: 'from-[#C9F5FF] via-[#E5FBFF] to-white',
    },
    {
      id: 'seller',
      title: '판매자 프로필 생성',
      description: '동네 고객과 빠르게 만날 수 있도록 상점 정보를 정리해 주세요.',
      highlights: [
        { icon: Store, label: '사업자등록번호 및 대표자 정보' },
        { icon: MapPin, label: '사업장 주소와 전화번호' },
        { icon: IdCard, label: '정산 계좌 정보·인증' },
        { icon: Camera, label: '대표이미지 및 개업 일자 ' },
      ],
      cta: '판매자 프로필 만들기',
      href: '/make-profile/seller',
      accent: 'from-[#FFF2C8] via-[#FFF8E3] to-white',
    },
    {
      id: 'rider',
      title: '배달원 프로필 생성',
      description: '동네 심부름과 소매 배송을 맡을 준비를 해 주세요.',
      highlights: [
        { icon: Bike, label: '배송 가능 구역' },
        { icon: BadgeCheck, label: '닉네임·신원 확인 및 프로필 사진' },
        { icon: MapPin, label: '위치 정보 이용 동의' },
        { icon: IdCard, label: '정산 계좌 등록' },
      ],
      cta: '배달원 프로필 만들기',
      href: '/make-profile/rider',
      accent: 'from-[#E3E9FF] via-[#F0F4FF] to-white',
    },
  ] as const;

  return (
    <div className='flex min-h-[100dvh] w-full flex-col bg-[#2ac1bc] shadow-[0_32px_80px_-40px_rgba(26,86,75,0.55)]'>
      <header className='relative px-4 pb-6 pt-9 text-white sm:px-6 sm:pt-10'>
        <div className='absolute inset-x-5 bottom-0 h-[1px] bg-white/30 sm:inset-x-6' aria-hidden />
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-[11px] sm:tracking-[0.35em]'>
            What a day!
          </span>
        </div>
        <h1 className='mt-4 text-[1.75rem] font-extrabold leading-tight sm:mt-5 sm:text-3xl'>
          오늘도 동네 상점과
          <br />
          우리집을 이어줘요
        </h1>
        <p className='mt-2.5 text-[13px] leading-relaxed text-white/80 sm:mt-3 sm:text-sm'>
          문구부터 반찬, 생활잡화까지.
          <br />
          원하는 역할을 선택하면 주문·픽업·정산 흐름을 바로 맞춰 드릴게요.
        </p>
        <div className='mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white/90 sm:gap-2 sm:px-3 sm:text-[11px]'>
          <span className='inline-block size-1.5 rounded-full bg-[#ffe14a] sm:size-2' />
          역할은 언제든 자유롭게 전환 가능해요
        </div>
      </header>

      <main className='flex-1 space-y-4 overflow-y-auto rounded-t-[1.5rem] bg-[#f8f9fa] px-4 pb-6 pt-6 outline outline-[1.5px] outline-[#2ac1bc]/15 sm:space-y-5 sm:rounded-t-[1.75rem] sm:px-6 sm:pb-7 sm:pt-7'>
        {/* <Card className='border-none bg-white shadow-sm'>
          <CardHeader className='space-y-2 pb-2.5 sm:pb-3'>
            <CardTitle className='text-[15px] font-semibold text-[#2ac1bc] sm:text-base'>
              동네 배송 준비 체크리스트
            </CardTitle>
            <CardDescription className='text-[12px] text-[#4a4a4a] sm:text-[13px]'>
              가게와 고객이 빠르게 연결될 수 있도록
              <br />
              필수 정보를 확인해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2.5 sm:space-y-3'>
            <div className='flex items-center gap-2.5 rounded-xl bg-[#f0fffd] px-3 py-2 text-[13px] text-[#2ac1bc] sm:gap-3 sm:py-2.5 sm:text-sm'>
              <span className='mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc] sm:size-6'>
                1
              </span>
              수령자 이름, 연락처, 배송 메모를 정리해 두세요.
            </div>
            <div className='flex items-center gap-2.5 rounded-xl bg-[#f9f9f9] px-3 py-2 text-[13px] text-[#4a4a4a] sm:gap-3 sm:py-2.5 sm:text-sm'>
              <span className='mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc] sm:size-6'>
                2
              </span>
              역할별 기본 정보(상점 소개, 픽업 가능 시간 등)를 준비해 주세요.
            </div>
            <div className='flex items-center gap-2.5 rounded-xl bg-[#f9f9f9] px-3 py-2 text-[13px] text-[#4a4a4a] sm:gap-3 sm:py-2.5 sm:text-sm'>
              <span className='mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc] sm:size-6'>
                3
              </span>
              모든 정보를 입력하면 즉시 동네 배송을 시작할 수 있어요.
            </div>
          </CardContent>
        </Card> */}

        <div className='space-y-3.5 sm:space-y-4'>
          {profileOptions.map((option) => (
            <Card key={option.id} className='flex flex-col border border-[#e6f8f7] bg-white shadow-sm'>
              <CardHeader className='space-y-2.5 pb-0 sm:space-y-3'>
                <div
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r ${option.accent} px-2.5 py-1 text-[10px] font-semibold text-[#1c807d] sm:gap-2 sm:px-3 sm:text-[11px]`}>
                  {option.title.replace(' 프로필 생성', '')}
                </div>
                <CardTitle className='text-lg font-bold text-[#1b1b1b] sm:text-xl'>{option.title}</CardTitle>
                <CardDescription className='text-[13px] text-[#5c5c5c] sm:text-sm'>
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-3 sm:pt-4'>
                <ul className='space-y-2.5 sm:space-y-3'>
                  {option.highlights.map(({ icon: Icon, label }) => (
                    <li key={label} className='flex items-center gap-3 text-[13px] text-[#4a4a4a] sm:text-sm'>
                      <span className='mt-0.5 flex size-7 items-center justify-center rounded-full bg-[#f0fffd] text-[#2ac1bc] sm:size-8'>
                        <Icon className='size-[15px] sm:size-4' strokeWidth={2} />
                      </span>
                      <span className='leading-snug'>{label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className='pb-4 pt-0 sm:pb-5'>
                <Button
                  asChild
                  size='lg'
                  className='h-10 w-full rounded-full bg-[#2ac1bc] text-sm font-semibold text-white hover:bg-[#1ba7a1] sm:h-11'>
                  <Link to={option.href} className='inline-flex w-full items-center justify-center gap-2'>
                    {option.cta}
                    <ArrowRight className='size-[15px] sm:size-4' aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <footer className='border-t border-white/20 bg-[#2ac1bc] px-6 py-5 text-center text-[11px] font-semibold text-white/80'>
        프로필은 설정에서 언제든 변경할 수 있어요.
        <br />
        오늘도 동네 부탁, 뭐든배달과 함께해요!
      </footer>
    </div>
  );
}
