import { getUserFromToken, isLoggedIn } from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import { createAlert, editAlert, getCurrentAlert, removeAlert } from '@/lib/commission';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from "formidable";
export const config = {
  api: {
    bodyParser: false,
  },
};

function bodyParser(
  form: any,
  req: NextApiRequest
): Promise<{
  err: any;
  fields: any;
  files: any;
}> {
  return new Promise((resolve) => {
    form.parse(req, (err: any, fields: any, files: any) => {
      resolve({
        err: err,
        fields: fields,
        files: files,
      });
    });
  });
}

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

  if(userResponse.userData.id != process.env.USER_ID)
  {
    return res.status(403).end();
  }

  const { text } = (await bodyParser(new formidable.IncomingForm(), req)).fields;
  if(!text || text.length > 150)
    return res.status(400).end();

  const current = await getCurrentAlert();
  if(current)
  {
    const lines = text.split("\n");
    const theSame = (lines.length == current.length) && lines.every(function(element: string, index: number) {
      return element === current[index]; 
    });

    if(!theSame)
      await editAlert(lines);
  }
  else
  {
    await createAlert(text.split("\n"));
  }
  res.status(200).end();
  return;
});
