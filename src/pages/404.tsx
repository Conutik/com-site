import * as React from 'react';
import { useRouter } from 'next/router';

export default function NotFoundPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.push('/');
  }, []);
  return <div></div>;
}
