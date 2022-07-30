import { useRouter } from 'next/router';
import { useRef, useState } from 'react';

interface DownloadFileProps {
  readonly apiDefinition: () => Promise<Response>;
  readonly preDownloading: () => void;
  readonly postDownloading: () => void;
  readonly onError: () => void;
}

interface DownloadedFileInfo {
  readonly download: () => Promise<void>;
  readonly ref: React.MutableRefObject<HTMLAnchorElement | null>;
  readonly url: string | undefined;
}

export const useDownloadFile = ({
  apiDefinition,
  preDownloading,
  postDownloading,
  onError,
}: DownloadFileProps): DownloadedFileInfo => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [url, setFileUrl] = useState<string>();
  const router = useRouter();

  const download = async () => {
    try {
      preDownloading();

      const response = await apiDefinition();

      if (response.status != 200) return router.reload();

      const url = URL.createObjectURL(await response.blob());
      setFileUrl(url);
      if (ref.current) ref.current.href = url;
      ref.current?.click();
      postDownloading();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError();
    }
  };

  return { download, ref, url };
};
