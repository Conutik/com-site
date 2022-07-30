import { NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { ImAttachment } from 'react-icons/im';

import {
  getUserFromToken,
  isLoggedIn,
  requestTokenPair,
  UserSanitizedData,
} from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import clsxm from '@/lib/clsxm';
import {
  Commission,
  CommissionUpdate,
  getCommissions,
  getCurrentAlert,
  getLatestUpdates,
} from '@/lib/commission';

import CommissionStatus from '@/components/CommissionStatus';
import TimedStatus from '@/components/TimedStatus';

const colorByStatus = {
  completed: 'text-green-500 border-green-500',
  'not started': 'text-yellow-500 border-yellow-500',
  stuck: 'text-orange-500 border-orange-500',
};

export default function HomePage({
  user,
  commissions,
  alert,
  latestUpdates,
}: HomePageProps) {
  const router = useRouter();
  useEffect(() => {
    const removeQueryParam = (param: string) => {
      const { pathname, query } = router;
      const params = new URLSearchParams(query as any);
      params.delete(param);
      router.replace({ pathname, query: params.toString() }, undefined, {
        shallow: true,
      });
    };

    if (router.query.code) removeQueryParam('code');
  }, []);

  function username(desired: string, length: number) {
    let substring = desired.substring(0, length);
    if (substring.length == length) {
      substring = `${substring.slice(0, -3)}...`;
    }
    return substring;
  }
  return (
    <>
      <Head>
        <title>Conutik - Status Dashboard</title>
      </Head>
      <div className='flex h-full w-full flex-col gap-4 p-4 sm:p-10'>
        {user.admin && <span onClick={(e) => {
          e.preventDefault();
          router.push("/admin");
        }} className='text-middle-header border-2 cursor-pointer hover:bg-middle-header transition-all duration-300 hover:text-white border-middle-header rounded-full px-4 py-2 font-semibold w-max'>Go to Admin Panel</span>}
        {alert && (
          <div className='flex w-full flex-col gap-2 rounded-2xl bg-middle-header p-4 text-center text-sm font-medium text-white'>
            {alert.map((line, index) => {
              return (
                <span key={index} className={index == 0 ? '' : '-mt-2'}>
                  {line}
                </span>
              );
            })}
          </div>
        )}
        <div className='flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-card p-4 xs:justify-start'>
          <div className='mr-auto flex flex-col'>
            <span className='text-center text-xl font-bold text-header xs:text-left'>
              Status Dashboard
            </span>
            <span className='text-center text-sm font-medium text-slate-400 xs:text-left'>
              Here you can see all of your past and active commissions.
            </span>
          </div>
          <div className='flex w-max flex-wrap items-center gap-2 rounded-2xl bg-white py-2 px-3'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className='h-8 w-8'
              src={user.avatar}
              alt={user.username}
            ></img>
            <div className='flex flex-col xs:mr-3'>
              <span className='text-sm font-semibold text-middle-header'>
                Logged in as
              </span>
              <span className='-mt-0.5 text-xs text-slate-400'>
                {username(user.username, 20)}#{user.discriminator}
              </span>
            </div>
            <span
              onClick={async (e) => {
                e.preventDefault();
                await fetch('/api/logout', {
                  method: 'POST',
                });
                router.reload();
              }}
              className='w-full cursor-pointer rounded-full border-2 border-red-500 py-1 px-2 text-center text-xs text-red-500 transition-all duration-300 hover:bg-red-500 hover:text-white sm:w-max'
            >
              Log out
            </span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-bold text-header'>Unread Updates</span>
          <span className='flex h-6 w-6 items-center justify-center rounded-full bg-card p-1.5 font-bold text-header'>
            {latestUpdates.realLength > 9 ? 9 : latestUpdates.realLength}
          </span>
        </div>
        <span className='-mt-4 text-sm font-medium text-slate-400 xs:text-left'>
          This view will only show the 3 most recent updates.
        </span>
        <div className='-mt-2 flex flex-wrap items-center gap-4'>
          {latestUpdates.asArray.map((update, index) => {
            return (
              <div
                key={`${update.id}-${update._id}-${index}-${update.timestamp}`}
                className='flex w-full flex-col gap-1 rounded-2xl bg-card p-4 transition-all duration-300 hover:shadow-glow-card'
              >
                <div className='-mb-1 flex flex-wrap-reverse items-center gap-x-3'>
                  <span className='mr-auto text-base font-bold text-header'>
                    {update.title}
                  </span>
                  <span className='mb-1 -ml-1 flex w-max items-center gap-1 rounded-full border-2 border-white bg-white py-0.5 px-2 text-center text-xs font-semibold text-header xs:m-0'>
                    {update.code}
                  </span>
                </div>
                <div className='mr-auto flex flex-col gap-1'>
                  <span className='text-sm font-medium text-slate-400'>
                    {update.description}
                  </span>
                  <div className='flex flex-wrap gap-2'>
                    <TimedStatus timestamp={update.timestamp}></TimedStatus>
                    <div
                      onClick={async (e) => {
                        e.preventDefault();
                        await fetch(
                          `/api/read?id=${update.id}&code=${update.code}`,
                          {
                            method: 'POST',
                          }
                        );
                        router.reload();
                      }}
                      className='flex w-max cursor-pointer items-center gap-1 rounded-full py-0.5 px-2 text-center text-xs font-semibold text-primary'
                    >
                      <FaEye className='fill-primary'></FaEye>
                      <span>Mark as read</span>
                    </div>
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/status/${update.code}`);
                      }}
                      className='flex w-max cursor-pointer items-center gap-1 rounded-full py-0.5 px-2 text-center text-xs font-semibold text-primary'
                    >
                      <ImAttachment className='fill-primary'></ImAttachment>
                      <span>Go to commission</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {latestUpdates.asArray.length == 0 && (
            <span className='-mt-2 text-center text-sm font-medium text-slate-400 xs:text-left'>
              You&apos;ve read all updates!
            </span>
          )}
        </div>
        <span className='text-lg font-bold text-header'>Your Commissions</span>
        <div className='-mt-2 flex flex-wrap items-center gap-4'>
          {commissions.map((commission) => {
            return (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/status/${commission.code.toUpperCase()}`);
                }}
                className='flex flex-1 cursor-pointer flex-col gap-1 rounded-2xl bg-card p-4 transition-all duration-300 hover:shadow-glow-card'
                key={commission.code}
              >
                <div className='flex flex-wrap-reverse items-center gap-x-3 smx:flex-nowrap'>
                  <span className='mr-auto text-base font-bold text-header'>
                    {commission.code}
                  </span>
                  <span
                    className={`text-xs${
                      commission.discountedPrice ? ' mb-1 -ml-1 xs:m-0' : ''
                    } flex w-max items-center gap-1 rounded-full border-2 border-white bg-white py-0.5 px-2 text-center font-semibold text-header`}
                  >
                    <span>
                      {commission.discountedPrice
                        ? `Discounted: ${commission.discountedPrice} (From ${commission.price})`
                        : commission.price}
                    </span>
                  </span>
                </div>
                <span className='text-sm font-semibold text-middle-header'>
                  {commission.title}
                </span>
                <span className='-mt-1 mb-2 text-xs font-medium text-slate-400'>
                  {commission.description}
                </span>
                <div className='flex flex-wrap gap-2 xs:flex-nowrap'>
                  <CommissionStatus commission={commission}></CommissionStatus>
                  <span
                    className={clsxm(
                      'w-max rounded-full border-2 py-0.5 px-2 text-center text-xs font-semibold',
                      colorByStatus[commission.status]
                    )}
                  >
                    {commission.status.toUpperCase()}
                  </span>
                  {commission.file && (
                    <span className='flex w-max items-center gap-1 rounded-full border-2 border-slate-500 bg-slate-500 py-0.5 px-2 text-center text-xs font-semibold text-white'>
                      <ImAttachment className='fill-white'></ImAttachment>
                      <span>1 File</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {commissions.length == 0 && (
            <span className='-mt-2 text-center text-sm font-medium text-slate-400 xs:text-left'>
              You don&apos;t have any order with me. Perhaps it&apos;s time to
              create one?
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = withSession(async (ctx: NextPageContext) => {
  const req = ctx.req as any;

  if (ctx.query.code) {
    const result = await requestTokenPair(
      Array.isArray(ctx.query.code) ? ctx.query.code.join('') : ctx.query.code
    );
    if (!result) {
      return {
        redirect: {
          destination: `https://discord.com/api/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(
            process.env.REDIRECT_URI || ''
          )}&client_id=${process.env.CLIENT_ID}&scope=identify`,
          permanent: false,
        },
      };
    }

    req.session.set('user', result);
    await req.session.save();
  }

  const loggedIn = await isLoggedIn(req);

  if (!loggedIn) {
    return {
      redirect: {
        destination: `https://discord.com/api/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(
          process.env.REDIRECT_URI || ''
        )}&client_id=${process.env.CLIENT_ID}&scope=identify`,
        permanent: false,
      },
    };
  }

  const userResponse = await getUserFromToken(loggedIn);
  if (!userResponse || !userResponse.userData) {
    req.session.destroy();
    return {
      redirect: {
        destination: `https://discord.com/api/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(
          process.env.REDIRECT_URI || ''
        )}&client_id=${process.env.CLIENT_ID}&scope=identify`,
        permanent: false,
      },
    };
  }

  req.session.set('user', userResponse.tokenData);
  await req.session.save();

  const commissions = await getCommissions(userResponse.userData.id);

  return {
    props: {
      user: {
        ...userResponse.userData,
        ...(userResponse.userData.id == process.env.USER_ID && {
          admin: true,
        })
      },
      commissions: commissions,
      alert: await getCurrentAlert(),
      latestUpdates: await getLatestUpdates(userResponse.userData.id),
    },
  };
});

export type HomePageProps = {
  user: UserSanitizedData & {
    admin?: boolean
  };
  commissions: Commission[];
  alert: string[] | null;
  latestUpdates: {
    asArray: CommissionUpdate[];
    realLength: number;
  };
};
