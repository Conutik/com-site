import fs from 'fs';
import { NextApiResponse } from 'next';

import { getUserFromToken, isLoggedIn } from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import { getCommission } from '@/lib/commission';

export default withSession(async (req: any, res: NextApiResponse) => {
  // Require POST so users can't access this link directly
  if (req.method != 'POST') {
    res.status(400).json({
      error: 'You are required to use POST on this route.',
    });
    return;
  }

  const loggedIn = await isLoggedIn(req);

  if (!loggedIn) {
    return res.status(403).end();
  }

  const userResponse = await getUserFromToken(loggedIn);
  if (!userResponse || !userResponse.userData) {
    req.session.destroy();
    return res.redirect(
      `https://discord.com/api/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(
        process.env.REDIRECT_URI || ''
      )}&client_id=${process.env.CLIENT_ID}&scope=identify`
    );
  }

  req.session.set('user', userResponse.tokenData);
  await req.session.save();

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      error: 'Empty code',
    });
  }

  const commission = await getCommission(code, userResponse.userData.id);
  if (!commission) {
    return res.status(403).end();
  }

  const buffer = fs.createReadStream(`.${commission.file}`);

  await new Promise(function (resolve) {
    buffer.pipe(res);
    buffer.on('end', resolve);
    buffer.on('error', function (err) {
      res.status(500).end();
      buffer.destroy();
    });
  });

  res.status(200).end();
  return;
});
