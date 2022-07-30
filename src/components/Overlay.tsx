import React, { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

export default function Overlay({
  children,
  active = false,
  className,
  setActive,
  exceptWidth = false,
}: PropsWithChildren<OverlayArgs>) {
  function useOutsideAlerter(ref: any) {
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          event.target instanceof Element &&
          event.target.classList.contains('popup')
        ) {
          setActive(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [ref]);
  }

  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef);

  return (
    <div
      className={`${
        active ? '!w-full' : exceptWidth ? '' : '!w-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export type OverlayArgs = {
  active: boolean;
  className: string;
  setActive: (arg: boolean) => void;
  exceptWidth?: boolean;
};
