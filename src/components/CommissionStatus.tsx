import { PropsWithChildren, useEffect, useState } from 'react';
import { ImClock } from 'react-icons/im';
import Sugar from 'sugar';

import { Commission } from '@/lib/commission';

export default function CommissionStatus({
  commission,
  useSM,
}: PropsWithChildren<{
  commission: Commission;
  useSM?: boolean;
}>) {
  function doUpdate() {
    if (value == 'AWAITING CONFIRMATION') return;

    const deadline = Sugar.Date.create(commission.deadline, {
      fromUTC: true,
    });
    const now = Sugar.Date.create('now');

    if (Sugar.Date.isBefore(deadline, now)) {
      setValue('AWAITING CONFIRMATION');
    } else {
      const relative = Sugar.Date.relativeTo(deadline, now);
      setValue(relative.toUpperCase());
    }
  }
  const [value, setValue] = useState('CALCULATING');
  useEffect(() => {
    doUpdate();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(doUpdate, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [value]);
  return (
    <>
      {commission.status != 'completed' && (
        <span
          className={`${
            useSM ? 'text-sm' : 'text-xs'
          } flex w-max items-center gap-1 rounded-full border-2 border-purple-500 bg-purple-500 py-0.5 px-2 text-center font-semibold text-white`}
        >
          <ImClock className='fill-white'></ImClock>
          <span>{value}</span>
        </span>
      )}
    </>
  );
}
