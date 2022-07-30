import { getUserFromToken, isLoggedIn } from '@/lib/auth/discord';
import withSession from '@/lib/auth/session';
import { createAlert, createCommission, editAlert, getCurrentAlert, removeAlert } from '@/lib/commission';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from "formidable";
import Sugar from 'sugar';
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

  const { description, title, discountedPrice, price, deadline, userId } = (await bodyParser(new formidable.IncomingForm(), req)).fields;
  
  jsonError.titleError = checkTitle(title);
  jsonError.descriptionError = checkDescription(description);
  jsonError.userIdError = checkUserId(userId);
  jsonError.deadlineError = checkDeadline(deadline);
  jsonError.priceError = checkPrice(price);
  jsonError.discountedPriceError = checkDiscountedPrice(discountedPrice);

  Object.keys(jsonError).forEach(key => jsonError[key] === undefined && delete jsonError[key])
  if(Object.keys(jsonError).length > 0)
    return res.status(400).json(jsonError);

  await createCommission({
    title,
    description,
    discountedPrice,
    price,
    deadline,
    userId,
  })

  res.status(200).end();
  return;
});

function checkTitle(value: string)
{
  if(!value || value.length < 5)
    return "Title too short or empty."
  
  if(value.length > 20)
    return "Title too long."

  return undefined;
}

function checkDescription(value: string)
{
  if(!value || value.length < 5)
    return "Description too short or empty."
  
  if(value.length > 50)
    return "Description too long."

  return undefined;
}

function checkUserId(value: string)
{
  if(!value || value.length < 10)
    return "User ID too short or empty."
  
  if(value.length > 20)
    return "User ID too long."

  if(isNaN(Number.parseInt(value)))
    return "Invalid format."
  return undefined;
}

function checkPrice(value: string)
{
  if(!value || value.length < 1)
    return "Price too short or empty."
  
  if(value.length > 20)
    return "Price too long."

  value = value.replace(/\D/g,'');
  if(isNaN(Number.parseInt(value)))
    return "Invalid format."

  return undefined;
}

function checkDiscountedPrice(value: string)
{
  if(!value)
    return undefined;
  
  if(value.length < 1)
    return "Discounted price too short."
  
  if(value.length > 20)
    return "Discounted price too long."

  value = value.replace(/\D/g,'');
  if(isNaN(Number.parseInt(value)))
    return "Invalid format."
    
  return undefined;
}

function checkDeadline(value: string)
{
  if(!value)
    return "Deadline empty."

  if(Sugar.Date.create(Number.parseInt(value), {
    fromUTC: true,
  }).toString() == "Invalid Date")
    return "Invalid Date";
  
  return undefined;
}
