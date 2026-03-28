import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  type AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider';

export const COGNITO_REGION = process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
export const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? '';

function getClient() {
  if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID) {
    throw new Error(
      'Missing Cognito configuration. Set COGNITO_CLIENT_ID and COGNITO_USER_POOL_ID env vars.'
    );
  }
  return new CognitoIdentityProviderClient({ region: COGNITO_REGION });
}

function getClientId() {
  if (!COGNITO_CLIENT_ID) {
    throw new Error('Missing COGNITO_CLIENT_ID env var.');
  }
  return COGNITO_CLIENT_ID;
}

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function toTokens(result: AuthenticationResultType): CognitoTokens {
  return {
    idToken: result.IdToken!,
    accessToken: result.AccessToken!,
    refreshToken: result.RefreshToken!,
    expiresIn: result.ExpiresIn ?? 3600,
  };
}

/** Sign in with email and password. Returns tokens on success. */
export async function cognitoSignIn(email: string, password: string): Promise<CognitoTokens> {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: getClientId(),
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const response = await getClient().send(command);

  if (!response.AuthenticationResult) {
    throw new Error('Authentication failed');
  }

  return toTokens(response.AuthenticationResult);
}

/** Register a new user with email and password. Cognito sends verification email. */
export async function cognitoSignUp(
  email: string,
  password: string,
  name: string
): Promise<{ userSub: string }> {
  const command = new SignUpCommand({
    ClientId: getClientId(),
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
    ],
  });

  const response = await getClient().send(command);

  return { userSub: response.UserSub! };
}

/** Confirm sign-up with the verification code sent to email. */
export async function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: getClientId(),
    Username: email,
    ConfirmationCode: code,
  });

  await getClient().send(command);
}

/** Resend the verification code to the user's email. */
export async function cognitoResendVerification(email: string): Promise<void> {
  const command = new ResendConfirmationCodeCommand({
    ClientId: getClientId(),
    Username: email,
  });

  await getClient().send(command);
}

/** Initiate forgot password flow. Cognito sends a reset code to email. */
export async function cognitoForgotPassword(email: string): Promise<void> {
  const command = new ForgotPasswordCommand({
    ClientId: getClientId(),
    Username: email,
  });

  await getClient().send(command);
}

/** Confirm password reset with code and new password. */
export async function cognitoConfirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: getClientId(),
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });

  await getClient().send(command);
}

/** Refresh an expired access token using a refresh token. */
export async function cognitoRefreshTokens(
  refreshToken: string
): Promise<Omit<CognitoTokens, 'refreshToken'>> {
  const command = new InitiateAuthCommand({
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: getClientId(),
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  const response = await getClient().send(command);

  if (!response.AuthenticationResult) {
    throw new Error('Token refresh failed');
  }

  return {
    idToken: response.AuthenticationResult.IdToken!,
    accessToken: response.AuthenticationResult.AccessToken!,
    expiresIn: response.AuthenticationResult.ExpiresIn ?? 3600,
  };
}

/** Sign out globally (invalidate all tokens). */
export async function cognitoGlobalSignOut(accessToken: string): Promise<void> {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  await getClient().send(command);
}

/** Get user attributes from Cognito using an access token. */
export async function cognitoGetUser(accessToken: string) {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await getClient().send(command);

  const attrs: Record<string, string> = {};
  for (const attr of response.UserAttributes ?? []) {
    if (attr.Name && attr.Value) {
      attrs[attr.Name] = attr.Value;
    }
  }

  return {
    username: response.Username!,
    email: attrs.email ?? '',
    name: attrs.name ?? '',
    emailVerified: attrs.email_verified === 'true',
    sub: attrs.sub ?? response.Username!,
  };
}
