import { PropsWithChildren, useEffect, useState } from 'react';
import { FaRegBell } from 'react-icons/fa';
import Sugar from 'sugar';

export default function TimedStatus({
  timestamp,
  textOnly,
}: PropsWithChildren<{
  timestamp: number;
  textOnly?: boolean;
}>) {
  const [value, setValue] = useState('CALCULATING');
  useEffect(() => {
    const deadline = Sugar.Date.create(timestamp, {
      fromUTC: true,
    });
    console.log(timestamp);
    setValue(
      Sugar.Date.format(
        deadline,
        '{Weekday}, {Month} {d}, {year}, {hours}:{mm} {TT}'
      )
    );
  }, []);
  return (
    <>
      <span
        className={`flex w-max items-center gap-1 text-center font-semibold ${
          textOnly
            ? 'text-xs text-middle-header xs:text-sm'
            : 'rounded-full border-2 border-purple-500 bg-purple-500 py-0.5 px-2 text-xs text-white'
        }`}
      >
        {!textOnly && <FaRegBell className='fill-white'></FaRegBell>}
        <span>{value}</span>
      </span>
    </>
  );
}
