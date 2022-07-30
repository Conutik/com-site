import withSession from '@/lib/auth/session';
import { NextApiResponse } from 'next';

export default withSession(async (req: any, res: NextApiResponse) => {
  // Require POST so users can't access this link directly
  if (req.method != 'POST') {
    res.status(400).json({
      error: 'You are required to use POST on this route.',
    });
    return;
  }

  req.session.destroy();
  res.status(200).end();
  return;
});
