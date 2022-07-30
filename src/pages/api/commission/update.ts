import { getUserFromToken, isLoggedIn } from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import { changeFile, commissionExists, createAlert, createCommission, createUpdate, editAlert, getCommission, getCurrentAlert, removeAlert } from '@/lib/commission';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from "formidable";
import Sugar from 'sugar';
import fs from 'fs/promises';
import fsSync from 'fs';
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

  const jsonError: any = {};

  const parserResult = (await bodyParser(new formidable.IncomingForm(), req));
  const { code, description, title, status } = parserResult.fields;
  const { file } = parserResult.files;
  
  jsonError.titleError = checkTitle(title);
  jsonError.descriptionError = checkDescription(description);
  jsonError.codeError = await checkCode(code);

  Object.keys(jsonError).forEach(key => jsonError[key] === undefined && delete jsonError[key])
  if(Object.keys(jsonError).length > 0)
    return res.status(400).json(jsonError);  

  let path = '';
  if(file)
  {    
    const fileName = encodeURIComponent(file.originalFilename.replace(/\s/g, "-"));
    path = `/uploads/${code}/${fileName}`;

    try {
      await fs.access(`./uploads/${code}`)
    } catch (error)
    {
      await fs.mkdir(`./uploads/${code}`);
    }
    const stream = fsSync.createWriteStream(`.${path}`);
    const readableStream = fsSync.createReadStream(file.filepath);

    await new Promise<void>((resolve) => {
      readableStream.on("end", () => {
        stream.destroy();
        readableStream.destroy();
        resolve();
      }).pipe(stream);
    });

    await changeFile(code, path);
  }

  await createUpdate(code, { title: title, description: description, attachedFile: file ? true : undefined, newStatus: status, })
  res.status(200).end();
  return;
});

function checkTitle(value: string)
{
  if(!value || value.length < 5)
    return "Title too short or empty."
  
  if(value.length > 50)
    return "Title too long."

  return undefined;
}

async function checkCode(value: string)
{
  if(!value || value.length != 14)
    return "Code too short, long or empty."
  
  if(!await commissionExists(value))
    return "There is no commission that uses this code."

  return undefined;
}

function checkDescription(value: string)
{
  if(!value || value.length < 5)
    return "Description too short or empty."
  
  if(value.length > 150)
    return "Description too long."

  return undefined;
}
