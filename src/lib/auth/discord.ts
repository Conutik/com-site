
/** Check if the user is logged in. */
export async function isLoggedIn(req: any) {
  const user = req.session.get('user');
  return user == null ? false : user;
}

export type TokenData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

/** Exchange code from discord. */
export async function requestTokenPair(
  code: string
): Promise<TokenData | null> {
  const API_ENDPOINT = 'https://discord.com/api/v10';
  const CLIENT_ID = process.env.CLIENT_ID || '';
  const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
  const REDIRECT_URI = process.env.REDIRECT_URI || '';

  const data = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
  };
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const form = new URLSearchParams();
  Object.entries(data).forEach((map) => {
    form.append(map[0], map[1]);
  });

  try {
    const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
      method: 'POST',
      headers: headers,
      body: form,
    });

    if (response.status != 200) {
      return null;
    }

    const json = await response.json();
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresIn: json.expires_in,
    };
  } catch (err) {
    return null;
  }
}

export type UserSanitizedData = {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
};
export type UserData = {
  tokenData: TokenData;
  userData: UserSanitizedData | null;
};

/** Get the user id, avatar and display name. This refreshes the token automatically. */
export async function getUserFromToken(
  tokenData: TokenData
): Promise<UserData | null> {
  const tokenResult = await exchangeRefreshToken(tokenData);
  if (!tokenResult) {
    return null;
  }

  const API_ENDPOINT = 'https://discord.com/api/v10';

  const headers = {
    Authorization: `Bearer ${tokenResult.accessToken}`,
  };

  try {
    const response = await fetch(`${API_ENDPOINT}/oauth2/@me`, {
      headers: headers,
    });

    if (response.status != 200) {
      return null;
    }

    const json = await response.json();
    return {
      userData: {
        id: json.user.id,
        username: json.user.username,
        avatar: `https://cdn.discordapp.com/avatars/${json.user.id}/${json.user.avatar}.png?size=40`,
        discriminator: json.user.discriminator,
      },
      tokenData: tokenResult,
    };
  } catch (err) {
    return {
      tokenData: tokenResult,
      userData: null,
    };
  }
}

/** Refresh access token for further use. */
export async function exchangeRefreshToken(
  tokenData: TokenData
): Promise<TokenData | null> {
  const API_ENDPOINT = 'https://discord.com/api/v10';
  const CLIENT_ID = process.env.CLIENT_ID || '';
  const CLIENT_SECRET = process.env.CLIENT_SECRET || '';

  const data = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: tokenData.refreshToken,
  };
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const form = new URLSearchParams();
  Object.entries(data).forEach((map) => {
    form.append(map[0], map[1]);
  });

  try {
    const response = await fetch(`${API_ENDPOINT}/oauth2/token`, {
      method: 'POST',
      headers: headers,
      body: form,
    });

    if (response.status != 200) {
      return null;
    }

    const json = await response.json();
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresIn: json.expires_in,
    };
  } catch (err) {
    return null;
  }
}
