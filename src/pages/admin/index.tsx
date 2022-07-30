import { NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AiOutlineCloseCircle, AiOutlineEdit, AiOutlineFileAdd, AiOutlinePlusCircle } from 'react-icons/ai';
import {FaTimes} from "react-icons/fa";
import { ImAttachment, ImSpinner8 } from 'react-icons/im';
import Sugar from 'sugar';

import {
  getUserFromToken,
  isLoggedIn,
  requestTokenPair,
  UserSanitizedData,
} from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import clsxm from '@/lib/clsxm';
import {
  getCurrentAlert,
} from '@/lib/commission';

import Overlay from '@/components/Overlay';

const colorByStatus = {
  completed: ['text-green-500 border-green-500', 'bg-green-500 border-green-500 text-white'],
  'not started': ['text-yellow-500 border-yellow-500', 'bg-yellow-500 border-yellow-500 text-white'],
  stuck: ['text-orange-500 border-orange-500', 'bg-orange-500 border-orange-500 text-white'],
};

export default function AdminPage({ user, alert }: StatusPageProps) {
  const router = useRouter();
  const [value, setValue] = useState('');

  function username(desired: string, length: number) {
    let substring = desired.substring(0, length);
    if (substring.length == length) {
      substring = `${substring.slice(0, -3)}...`;
    }
    return substring;
  }

  const [active, setActive] = useState(false);
  const [overlay, setOverlay] = useState(null as HTMLElement | null);
  const [page, setPage] = useState("");
  const [alertText, setAlertText] = useState(alert ? alert.join("\n") : "");
  const [createStatus, setCreateStatus] = useState(false);
  const [createAlertError, setCreateAlertError] = useState(false);

  const [commissionDescription, setCommissionDescription] = useState("");
  const [commissionDescriptionError, setCommissionDescriptionError] = useState("");
  const [commissionTitleError, setCommissionTitleError] = useState("");
  const [commissionTitle, setCommissionTitle] = useState("");
  const [commissionDeadline, setCommissionDeadline] = useState("");
  const [commissionDeadlineError, setCommissionDeadlineError] = useState("");
  const [commissionUserId, setCommissionUserId] = useState("");
  const [commissionUserIdError, setCommissionUserIdError] = useState("");
  const [commissionDeadlineDev, setCommissionDeadlineDev] = useState(0);
  const [commissionPriceError, setCommissionPriceError] = useState("");
  const [commissionPrice, setCommissionPrice] = useState("");
  const [commissionDiscountedPriceError, setCommissionDiscountedPriceError] = useState("");
  const [commissionDiscountedPrice, setCommissionDiscountedPrice] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filePicker, setFilePicker] = useState(null as HTMLElement | null);
  const [file, setFile] = useState(null as File | null);
  const [commissionCode, setCommissionCode] = useState("");
  const [commissionCodeError, setCommissionCodeError] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (overlay) overlay.style.display = active ? '' : 'none';
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [active, overlay]);

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  return (
    <>
      <Head>
        <title>Conutik - Admin Panel</title>
      </Head>
      <div
        ref={setOverlay}
        className={`${
          active ? 'opacity-100' : 'opacity-0'
        } fixed top-0 left-0 z-50 h-full w-full transition-all duration-300`}
      >
        <Overlay
          exceptWidth
          className='fixed top-0 left-0 z-50 flex justify-center w-full h-full bg-black popup bg-opacity-60'
          active={active}
          setActive={setActive}
        >
          {page == "create_alert" && 
          <form onSubmit={async (e) => {
            e.preventDefault();
            if(createStatus)
              return;

            setCreateStatus(true);
            setCreateAlertError(false);

            const formData = new FormData();
            formData.set("text", alertText);
            const res = await fetch("/api/alert/create", {
              method: "POST",
              body: formData
            })

            setCreateStatus(false);

            if(res.status == 200)
            {
              router.reload();
            } else
            {
              setCreateAlertError(true);
            }
          }} className='mt-[3%] flex h-max w-11/12 flex-col gap-4 rounded-lg bg-white p-6 md:w-10/12 lg:max-w-4xl'>
            <div className='flex items-center w-full pb-4 border-b border-b-slate-400'>
              <span className='text-lg font-bold text-middle-header md:text-xl'>
                Create Alert
              </span>
              <FaTimes
                className='w-6 h-6 ml-auto transition-all duration-300 cursor-pointer fill-red-500 hover:fill-primary'
                onClick={(e) => {
                  e.preventDefault();
                  setActive(false);
                }}
              ></FaTimes>
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Alert Text{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <textarea
                required
                rows={3}
                maxLength={150}
                value={alertText}
                onChange={(e) => {
                  setAlertText(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></textarea>
              {createAlertError && <span className='text-sm text-red-500 text-right w-full'>Invalid Value</span>}
            </div>
            <button
              type='submit'
              className='flex items-center group transition-all duration-300 justify-center w-full gap-2 py-2 text-primary rounded-full border-2 hover:bg-primary hover:text-white border-primary xs:mt-1'
            >
              Creat{createStatus ? 'ing' : 'e'} Alert
              <ImSpinner8
                className={`animate-spin fill-primary group-hover:fill-white transition-all duration-300 ${
                  createStatus ? 'block' : 'hidden'
                }`}
              ></ImSpinner8>
              </button>
          </form>}
          {page == "edit_alert" && 
          <form onSubmit={async (e) => {
            e.preventDefault();
            if(createStatus)
              return;

            setCreateStatus(true);
            setCreateAlertError(false);

            const formData = new FormData();
            formData.set("text", alertText);
            const res = await fetch("/api/alert/create", {
              method: "POST",
              body: formData
            })

            setCreateStatus(false);

            if(res.status == 200)
            {
              router.reload();
            } else
            {
              setCreateAlertError(true);
            }
          }} className='mt-[3%] flex h-max w-11/12 flex-col gap-4 rounded-lg bg-white p-6 md:w-10/12 lg:max-w-4xl'>
            <div className='flex items-center w-full pb-4 border-b border-b-slate-400'>
              <span className='text-lg font-bold text-middle-header md:text-xl'>
                Edit Alert
              </span>
              <FaTimes
                className='w-6 h-6 ml-auto transition-all duration-300 cursor-pointer fill-red-500 hover:fill-primary'
                onClick={(e) => {
                  e.preventDefault();
                  setActive(false);
                }}
              ></FaTimes>
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Alert Text{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <textarea
                required
                rows={3}
                maxLength={150}
                value={alertText}
                onChange={(e) => {
                  setAlertText(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></textarea>
              {createAlertError && <span className='text-sm text-red-500 text-right w-full'>Invalid Value</span>}
            </div>
            <button
              type='submit'
              className='flex items-center group transition-all duration-300 justify-center w-full gap-2 py-2 text-primary rounded-full border-2 hover:bg-primary hover:text-white border-primary xs:mt-1'
            >
              Edit{createStatus ? 'ing' : ''} Alert
              <ImSpinner8
                className={`animate-spin fill-primary group-hover:fill-white transition-all duration-300 ${
                  createStatus ? 'block' : 'hidden'
                }`}
              ></ImSpinner8>
              </button>
          </form>}
          {page == "create_commission" && 
          <form onSubmit={async (e) => {
            e.preventDefault();
            if(createStatus)
              return;

            setCreateStatus(true);
            setCommissionDescriptionError("");
            setCommissionTitleError("");
            setCommissionUserIdError("");
            setCommissionDeadlineError("");
            setCommissionPriceError("");
            setCommissionDiscountedPriceError("");

            const formData = new FormData();
            formData.set("title", commissionTitle);
            formData.set("description", commissionDescription);
            formData.set("userId", commissionUserId);
            formData.set("deadline", `${commissionDeadlineDev}`);
            formData.set("price", commissionPrice);
            if(commissionDiscountedPrice != "")
              formData.set("discountedPrice", commissionDiscountedPrice);
            const res = await fetch("/api/commission/create", {
              method: "POST",
              body: formData
            })

            setCreateStatus(false);

            if(res.status == 200)
            {
              router.reload();
            } else
            {
              const json = await res.json();
              if(json.titleError)
                setCommissionTitleError(json.titleError);
              if(json.descriptionError)
                setCommissionDescriptionError(json.descriptionError);
              if(json.userIdError)
                setCommissionUserIdError(json.userIdError);
              if(json.deadlineError)
                setCommissionDeadlineError(json.deadlineError);
              if(json.priceError)
                setCommissionPriceError(json.priceError);
              if(json.discountedPriceError)
                setCommissionDiscountedPriceError(json.discountedPriceError);
            }
          }} className='mt-[3%] flex h-max w-11/12 flex-col gap-4 rounded-lg bg-white p-6 md:w-10/12 lg:max-w-4xl'>
            <div className='flex items-center w-full pb-4 border-b border-b-slate-400'>
              <span className='text-lg font-bold text-middle-header md:text-xl'>
                Create Commission
              </span>
              <FaTimes
                className='w-6 h-6 ml-auto transition-all duration-300 cursor-pointer fill-red-500 hover:fill-primary'
                onClick={(e) => {
                  e.preventDefault();
                  setActive(false);
                }}
              ></FaTimes>
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Title{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={20}
                value={commissionTitle}
                onChange={(e) => {
                  setCommissionTitle(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionTitleError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionTitleError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Description{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={50}
                value={commissionDescription}
                onChange={(e) => {
                  setCommissionDescription(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionDescriptionError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionDescriptionError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                User ID{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={20}
                value={commissionUserId}
                onChange={(e) => {
                  setCommissionUserId(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionUserIdError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionUserIdError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Deadline{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={100}
                value={commissionDeadline}
                onChange={(e) => {
                  const parsed = Sugar.Date.create(e.target.value, { setUTC: true });
                  setCommissionDeadline(e.target.value);
                  setCommissionDeadlineDev((parsed as any) - 0);
                  setCommissionDeadlineError(parsed.toString() == "Invalid Date" ? parsed.toString() : Sugar.Date.create(e.target.value).toString());
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionDeadlineError != "" && <span className={`text-sm ${commissionDeadlineError == "Invalid Date" ? "text-red-500" : "text-slate-500"} text-right w-full`}>{commissionDeadlineError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Price{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={20}
                value={commissionPrice}
                onChange={(e) => {
                  setCommissionPrice(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionPriceError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionPriceError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Discounted Price{' '}
              </span>
              <input
                type="text"
                maxLength={20}
                value={commissionDiscountedPrice}
                onChange={(e) => {
                  setCommissionDiscountedPrice(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionDiscountedPriceError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionDiscountedPriceError}</span>}
            </div>
            <button
              type='submit'
              className='flex items-center group transition-all duration-300 justify-center w-full gap-2 py-2 text-primary rounded-full border-2 hover:bg-primary hover:text-white border-primary xs:mt-1'
            >
              Creat{createStatus ? 'ing' : 'e'} Commission
              <ImSpinner8
                className={`animate-spin fill-primary group-hover:fill-white transition-all duration-300 ${
                  createStatus ? 'block' : 'hidden'
                }`}
              ></ImSpinner8>
              </button>
          </form>}
          {page == "create_update" && 
          <form onSubmit={async (e) => {
            e.preventDefault();
            if(createStatus)
              return;

            setCreateStatus(true);
            setCommissionDescriptionError("");
            setCommissionTitleError("");
            setCommissionCodeError("");

            const formData = new FormData();
            formData.set("code", commissionCode);
            formData.set("title", commissionTitle);
            formData.set("description", commissionDescription);
            if(selectedStatus != "")
              formData.set("status", selectedStatus);
            if(file)
              formData.set("file", file);
            const res = await fetch("/api/commission/update", {
              method: "POST",
              body: formData
            })

            setCreateStatus(false);

            if(res.status == 200)
            {
              router.reload();
            } else
            {
              const json = await res.json();
              if(json.titleError)
                setCommissionTitleError(json.titleError);
              if(json.descriptionError)
                setCommissionDescriptionError(json.descriptionError);
              if(json.codeError)
                setCommissionCodeError(json.codeError);
            }
          }} className='mt-[3%] flex h-max w-11/12 flex-col gap-4 rounded-lg bg-white p-6 md:w-10/12 lg:max-w-4xl'>
            <div className='flex items-center w-full pb-4 border-b border-b-slate-400'>
              <span className='text-lg font-bold text-middle-header md:text-xl'>
                Create Update
              </span>
              <FaTimes
                className='w-6 h-6 ml-auto transition-all duration-300 cursor-pointer fill-red-500 hover:fill-primary'
                onClick={(e) => {
                  e.preventDefault();
                  setActive(false);
                }}
              ></FaTimes>
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Commission Code{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={14}
                value={commissionCode}
                onChange={(e) => {
                  setCommissionCode(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionCodeError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionCodeError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Title{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <input
                required
                type="text"
                maxLength={50}
                value={commissionTitle}
                onChange={(e) => {
                  setCommissionTitle(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></input>
              {commissionTitleError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionTitleError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Description{' '}
                <span className='ml-3 font-normal text-2xs text-red-500'>
                  REQUIRED
                </span>
              </span>
              <textarea
                required
                maxLength={150}
                value={commissionDescription}
                onChange={(e) => {
                  setCommissionDescription(e.target.value);
                }}
                className="peer w-full rounded-lg border-2 border-slate-300 text-slate-500 hover:border-transparent focus:border-transparent bg-transparent text-sm !outline-none transition-all hover:shadow-glow-card focus:shadow-glow-card duration-300 !ring-0"
              ></textarea>
              {commissionDescriptionError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionDescriptionError}</span>}
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Choose a Status{' '}
              </span>
              <div className='flex gap-2 flex-wrap'>
                {Object.entries(colorByStatus).map(status => {
                  return (<span onClick={(e) => {
                    e.preventDefault();
                    if(selectedStatus == status[0])
                      setSelectedStatus("")
                    else
                      setSelectedStatus(status[0]);
                  }} key={status[0]}
                    className={clsxm(
                      'w-max rounded-full cursor-pointer transition-all duration-300 border-2 py-0.5 px-2 text-center text-xs font-semibold',
                      selectedStatus == status[0] ? status[1][1]: status[1][0]
                    )}
                  >
                    {status[0].toUpperCase()}
                  </span>);
                })}
              </div>
            </div>
            <div className='relative flex flex-col items-start gap-1'>
              <span className='flex items-center text-sm font-medium text-middle-header'>
                Attach a File{' '}
              </span>
              <input onChange={(e) => {
                e.preventDefault();
                const files = e.target.files;
                if(files)
                  setFile(files[0]);
              }} ref={setFilePicker} type="file" className="hidden"></input>
              <span onClick={(e) => {
                e.preventDefault();
                filePicker?.click();
              }} className='flex cursor-pointer border-2 border-slate-500 px-3 py-1 rounded-full transition-all duration-300 hover:bg-slate-500 hover:text-white items-center gap-2 text-slate-500 text-sm'>
                <ImAttachment></ImAttachment>
                <span>{file ? `${file.name} (${formatBytes(file.size)})` : "Choose a file"}</span>
              </span>
              {commissionTitleError != "" && <span className='text-sm text-red-500 text-right w-full'>{commissionTitleError}</span>}
            </div>
            <button
              type='submit'
              className='flex items-center group transition-all duration-300 justify-center w-full gap-2 py-2 text-primary rounded-full border-2 hover:bg-primary hover:text-white border-primary xs:mt-1'
            >
              Creat{createStatus ? 'ing' : 'e'} Update
              <ImSpinner8
                className={`animate-spin fill-primary group-hover:fill-white transition-all duration-300 ${
                  createStatus ? 'block' : 'hidden'
                }`}
              ></ImSpinner8>
              </button>
          </form>}
        </Overlay>
      </div>
      <div className='flex h-full w-full flex-col gap-4 p-4 sm:p-10'>
        <div className='flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-card p-4 xs:justify-start'>
          <div className='mr-auto flex flex-col'>
            <span className='text-center text-xl font-bold text-header xs:text-left'>
              Admin Panel
            </span>
            <span className='text-center text-sm font-medium text-slate-400 xs:text-left'>
              Welcome to your admin panel!
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
          <span className='text-lg font-bold text-header'>Quick Actions</span>
        </div>
        <div className='-mt-2 flex flex-wrap items-center gap-4 bg-card rounded-2xl p-4'>
          <div onClick={(e) => {
            e.preventDefault();
            if (overlay) overlay.style.display = !active ? '' : 'none';
            setTimeout(() => {
              setActive(true);
              setPage(alert ? "edit_alert" : "create_alert")
            }, 50);
          }} className='flex gap-2 items-center flex-1 cursor-pointer rounded-2xl bg-white p-4 transition-all duration-300 hover:shadow-glow-card'>
            {alert ? <AiOutlineEdit className="w-6 h-6 xs:w-8 xs:h-8 smx:w-10 smx:h-10 fill-header"></AiOutlineEdit> : <AiOutlinePlusCircle className="w-6 h-6 xs:w-8 xs:h-8 smx:w-10 smx:h-10 fill-header"></AiOutlinePlusCircle>}
            <div className='flex flex-col'>
              <span className='text-sm sm:text-base md:text-lg font-bold text-middle-header overflow-hidden whitespace-nowrap'>{alert ? "Modify Alert" : "Create Alert"}</span>
              <div className='-mt-1.5 text-sm hidden smx:flex md:text-base items-center gap-1 font-medium'>
                <span className='overflow-hidden whitespace-nowrap text-slate-400'>
                  {alert ? "Modify the current alert displayed to visitors." : "Create an alert to be displayed to visitors."}
                </span>
              </div>
            </div>
          </div>
          {alert && <div onClick={async (e) => {
            e.preventDefault();
            await fetch("/api/alert/delete", {
              method: "POST"
            })
            router.reload();
          }} className='flex gap-2 items-center flex-1 cursor-pointer rounded-2xl bg-white p-4 transition-all duration-300 hover:shadow-glow-card'>
            <AiOutlineCloseCircle className="w-6 h-6 xs:w-8 xs:h-8 smx:w-10 smx:h-10 fill-header"></AiOutlineCloseCircle>
            <div className='flex flex-col'>
              <span className='text-sm sm:text-base md:text-lg font-bold text-middle-header overflow-hidden whitespace-nowrap'>Remove Alert</span>
              <div className='-mt-1.5 text-sm hidden smx:flex md:text-base items-center gap-1 font-medium'>
                <span className='overflow-hidden whitespace-nowrap text-slate-400'>
                  Delete the currently shown alert.
                </span>
              </div>
            </div>
          </div>}
          <div onClick={(e) => {
            e.preventDefault();
            if (overlay) overlay.style.display = !active ? '' : 'none';
            setTimeout(() => {
              setActive(true);
              setPage("create_commission")
            }, 50);
          }} className='flex gap-2 items-center flex-1 cursor-pointer rounded-2xl bg-white p-4 transition-all duration-300 hover:shadow-glow-card'>
            <AiOutlineFileAdd className="w-6 h-6 xs:w-8 xs:h-8 smx:w-10 smx:h-10 fill-header"></AiOutlineFileAdd>
            <div className='flex flex-col'>
              <span className='text-sm sm:text-base md:text-lg font-bold text-middle-header overflow-hidden whitespace-nowrap'>Create Commission</span>
              <div className='-mt-1.5 text-sm hidden smx:flex md:text-base items-center gap-1 font-medium'>
                <span className='overflow-hidden whitespace-nowrap text-slate-400'>
                  Create a commission for an user.
                </span>
              </div>
            </div>
          </div>
          <div onClick={(e) => {
            e.preventDefault();
            if (overlay) overlay.style.display = !active ? '' : 'none';
            setTimeout(() => {
              setActive(true);
              setPage("create_update")
            }, 50);
          }} className='flex gap-2 items-center flex-1 cursor-pointer rounded-2xl bg-white p-4 transition-all duration-300 hover:shadow-glow-card'>
            <AiOutlineEdit className="w-6 h-6 xs:w-8 xs:h-8 smx:w-10 smx:h-10 fill-header"></AiOutlineEdit>
            <div className='flex flex-col'>
              <span className='text-sm sm:text-base md:text-lg font-bold text-middle-header overflow-hidden whitespace-nowrap'>Add Update</span>
              <div className='-mt-1.5 text-sm hidden smx:flex md:text-base items-center gap-1 font-medium'>
                <span className='overflow-hidden whitespace-nowrap text-slate-400'>
                  Add an update to a commission.
                </span>
              </div>
            </div>
          </div>
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

  if(userResponse.userData.id != process.env.USER_ID)
  {
    return {
      redirect: {
        destination: "/",
        permanent: false
      }
    }
  }

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
