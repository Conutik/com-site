import { NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ImBarcode } from 'react-icons/im';

import {
  getUserFromToken,
  isLoggedIn,
  requestTokenPair,
  UserSanitizedData,
} from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import {
  getCurrentAlert,
} from '@/lib/commission';

export default function StatusPage({ user, alert }: StatusPageProps) {
  const router = useRouter();
  const [value, setValue] = useState('');

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
        <title>Conutik - Enter Code</title>
      </Head>
      <div className='flex h-full w-full flex-col gap-4 p-4 sm:p-10'>
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
              Code Status
            </span>
            <span className='text-center text-sm font-medium text-slate-400 xs:text-left'>
              Here you can go to a commission based on the code.
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
          <span className='text-lg font-bold text-header'>Enter Code</span>
        </div>
        <span className='-mt-4 text-sm font-medium text-slate-400 xs:text-left'>
          Press Enter after typing the code to go to the commission.
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/status/${value}`);
          }}
          className='-mt-2 flex items-center gap-4'
        >
          <div className='group relative mb-6 w-full'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <ImBarcode className='fill-slate-400 transition-all duration-300 group-focus-within:fill-middle-header group-hover:fill-middle-header'></ImBarcode>
            </div>
            <input
              type='text'
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              className='block w-full rounded-lg border-2 border-slate-400 p-2.5 pl-9 text-sm text-slate-400 !shadow-none !outline-none transition-all duration-300 placeholder:text-slate-400 placeholder:transition-all placeholder:duration-300 focus:ring-0 group-focus-within:border-middle-header group-focus-within:text-middle-header group-focus-within:placeholder:text-middle-header group-hover:border-middle-header group-hover:text-middle-header group-hover:placeholder:text-middle-header'
              placeholder='Enter code here'
            ></input>
          </div>
        </form>
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

  return {
    props: {
      user: userResponse.userData,
      alert: await getCurrentAlert(),
    },
  };
});

export type StatusPageProps = {
  user: UserSanitizedData;
  alert: string[] | null;
};
