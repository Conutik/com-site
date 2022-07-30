import clipboard from 'clipboard';
import { NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FaCopy, FaDownload } from 'react-icons/fa';
import {
  ImAttachment,
} from 'react-icons/im';

import {
  getUserFromToken,
  isLoggedIn,
  UserSanitizedData,
} from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import clsxm from '@/lib/clsxm';
import {
  Commission,
  getCommission,
  getCommissionFileSize,
  getCurrentAlert,
  markAsReadFull,
} from '@/lib/commission';
import { useDownloadFile } from '@/hooks/useDownloadFile';

import CommissionStatus from '@/components/CommissionStatus';
import TimedStatus from '@/components/TimedStatus';

const colorByStatus = {
  completed: 'text-green-500 border-green-500',
  'not started': 'text-yellow-500 border-yellow-500',
  stuck: 'text-orange-500 border-orange-500',
};

export default function StatusPage({
  user,
  alert,
  commission,
}: StatusPageProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  function username(desired: string, length: number) {
    let substring = desired.substring(0, length);
    if (substring.length == length) {
      substring = `${substring.slice(0, -3)}...`;
    }
    return substring;
  }

  const { ref, url, download } = useDownloadFile({
    apiDefinition: () =>
      fetch(`/api/download?code=${commission.code}`, {
        method: 'POST',
      }),
    preDownloading() {
      setDownloading(true);
    },
    postDownloading() {
      setDownloading(false);
    },
    onError() {
      //
    },
  });

  return (
    <>
      <Head>
        <title>{`Conutik - ${commission.code}`}</title>
      </Head>
      {commission.file && (
        <a
          download={
            commission.file
              ? commission.file.substring(commission.file.lastIndexOf('/') + 1)
              : ''
          }
          className='hidden'
          ref={ref}
        />
      )}
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
              Commission Status
            </span>
            <span className='text-center text-sm font-medium text-slate-400 xs:text-left'>
              Here you can see the current status of your commission.
            </span>
            <div className='mt-1 flex justify-center gap-2 xs:justify-start'>
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
          <span className='text-lg font-bold text-header'>
            Commission Details
          </span>
        </div>
        <div className='-mt-2 flex w-full flex-wrap items-center gap-4 rounded-2xl bg-card p-4'>
          <div className='flex h-full w-max flex-1 flex-col justify-center rounded-2xl bg-white py-3.5 px-4'>
            <span className='text-lg font-bold text-middle-header'>CODE</span>
            <div
              onClick={(e) => {
                e.preventDefault();
                clipboard.copy(commission.code);
              }}
              className='-mt-1.5 flex cursor-pointer items-center gap-1 text-sm font-medium xs:text-base'
            >
              <span className='text-slate-400'>{commission.code}</span>
              <FaCopy className='fill-slate-400'></FaCopy>
            </div>
          </div>
          <div className='flex h-full w-max flex-1 flex-col justify-center rounded-2xl bg-white py-3.5 px-4 text-sm xs:text-base'>
            <span className='text-lg font-bold text-middle-header'>TITLE</span>
            <div className='-mt-1.5 flex items-center gap-1 font-medium'>
              <span className='overflow-hidden whitespace-nowrap text-slate-400'>
                {commission.title}
              </span>
            </div>
          </div>
          <div className='flex h-full w-max flex-1 flex-col justify-center rounded-2xl bg-white py-3.5 px-4 text-sm xs:text-base'>
            <span className='text-lg font-bold text-middle-header'>PRICE</span>
            <div className='-mt-1.5 flex items-center gap-1 font-medium'>
              <span className='overflow-hidden whitespace-nowrap text-slate-400'>
                {commission.discountedPrice
                  ? `Discounted: ${commission.discountedPrice} (From ${commission.price})`
                  : commission.price}
              </span>
            </div>
          </div>
          <div className='flex h-full w-max flex-1 flex-col justify-center rounded-2xl bg-white py-3 px-4 text-sm xs:text-base'>
            <span className='text-lg font-bold text-middle-header'>
              {commission.file ? 'FILES' : 'CURRENT STATUS'}
            </span>
            <div className='-mt-1.5 flex items-center gap-1 font-medium'>
              <div className='mt-1 flex justify-center gap-2 xs:justify-start'>
                {commission.file ? (
                  <>
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        download();
                      }}
                      className='group flex w-max cursor-pointer items-center gap-1 rounded-full border-2 border-slate-400 py-0.5 px-2 text-center text-xs font-semibold text-slate-400 transition-all duration-300 hover:bg-slate-400 hover:text-white'
                    >
                      <FaDownload className='duuration-300 fill-slate-400 transition-all group-hover:fill-white'></FaDownload>
                      <span>
                        {downloading
                          ? 'Downloading File...'
                          : `Download File (${commission.fileSize})`}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <CommissionStatus
                      commission={commission}
                    ></CommissionStatus>
                    <span
                      className={clsxm(
                        'w-max rounded-full border-2 py-0.5 px-2 text-center text-xs font-semibold',
                        colorByStatus[commission.status]
                      )}
                    >
                      {commission.status.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-bold text-header'>
            Development Updates
          </span>
        </div>
        <div className='-mt-2 flex w-full flex-col gap-4 rounded-2xl bg-card p-6'>
          {commission.updates.map((update, index, arr) => {
            return (
              <div key={`${index}-${update.timestamp}`} className='flex gap-2'>
                <div className='relative'>
                  <div className='h-4 w-4 rounded-full border-[3px] border-middle-header xs:h-5 xs:w-5'></div>
                  {index != arr.length - 1 && (
                    <div className='absolute left-1.5 ml-px h-full border-l-2 border-dotted border-slate-400 xs:left-2 xs:h-[calc(100%_-_3px)]'></div>
                  )}
                </div>
                <div className='flex flex-col'>
                  <div className='flex flex-wrap'>
                    <TimedStatus
                      textOnly
                      timestamp={update.timestamp}
                    ></TimedStatus>
                  </div>
                  <span className='text-xs font-semibold text-middle-header xs:text-sm'>
                    <span>{update.title}:</span>
                    <span className='ml-1 font-medium text-slate-400'>
                      {update.description}
                    </span>
                  </span>
                  {(update.newStatus || update.attachedFile) && (
                    <div className='mt-1'></div>
                  )}
                  {update.newStatus && (
                    <span className='flex flex-wrap items-center gap-1 text-xs font-medium text-slate-400 sm:text-sm'>
                      <span>Assigned status to</span>
                      <span
                        className={clsxm(
                          'w-max rounded-full border-2 py-0.5 px-2 text-center text-xs font-semibold',
                          colorByStatus[update.newStatus]
                        )}
                      >
                        {update.newStatus.toUpperCase()}
                      </span>
                      <span className='-ml-1'>.</span>
                    </span>
                  )}
                  {update.newStatus && update.attachedFile && (
                    <div className='mt-1'></div>
                  )}
                  {update.attachedFile && (
                    <span className='flex items-center gap-1 text-xs font-medium text-slate-400 sm:text-sm'>
                      Attached
                      <span className='flex w-max items-center gap-1 rounded-full border-2 border-slate-500 bg-slate-500 py-0.5 px-2 text-center text-xs font-semibold text-white'>
                        <ImAttachment className='fill-white'></ImAttachment>
                        <span>1 File</span>
                      </span>{' '}
                      to the ticket.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = withSession(async (ctx: NextPageContext) => {
  const req = ctx.req as any;

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

  const code = Array.isArray(ctx.query.code)
    ? ctx.query.code.join('')
    : ctx.query.code || '';
  const commission = await getCommission(code, userResponse.userData.id);

  if (!commission) {
    return {
      redirect: {
        destination: `/`,
        permanent: false,
      },
    };
  }

  await markAsReadFull(code, userResponse.userData.id);

  commission.updates = [
    {
      _id: commission.code,
      code: commission.code,
      title: 'Created Commission',
      description: 'I received your commission and started working on it.',
      read: true,
      id: -1,
      timestamp: commission.createdAt,
    },
  ].concat(commission.updates);

  commission.updates[0].newStatus = 'not started';

  return {
    props: {
      user: userResponse.userData,
      alert: await getCurrentAlert(),
      commission: {
        ...commission,
        ...(commission.file && {
          fileSize: await getCommissionFileSize(commission),
        }),
      },
    },
  };
});

export type StatusPageProps = {
  user: UserSanitizedData;
  alert: string[] | null;
  commission: Commission & {
    fileSize: string;
  };
};
