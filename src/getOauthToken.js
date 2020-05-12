const AWS = require('aws-sdk');
const p = require('phin');

/**
 * Based on configured properties inside of AWS Parameter Store,
 * this library is guaranteed to always return a valid access token.
 * It assumes the following is configured inside of AWS Parameter Store:
 *
 * key:
 *  /oauth/OAUTH_KEY/secrets
 *      NOTE: OAUTH_KEY here must match with the OAUTH_KEY param
 *      passed to the getOAuthToken function.
 * value:
 *  {"clientId": "CLIENT_ID", "clientSecret": "CLIENT_SECRET","endpoint":"TOKEN_ENDPOINT"}
 *      NOTE: The CLIENT_ID, CLIENT_SECRET, and TOKEN_ENDPOINT should
 *      be the given to you by your OAuth provider. This value should be
 *      of type `SecureString`
 *
 * Your parameter store region can also be configured with the environment
 * variable PARAM_STORE_REGION, otherwise the assumed default is 'us-east-1'.
 *
 * When a valid token is obtained, it is stored inside of AWS Parameter Store
 * using the key `/oauth/OAUTH_KEY/token`. You can confirm that retrieving
 * the token was successful by checking inside of the Parameter Store.
 *
 */


// initialize new AWS Systems Manager client with region
const ssmClient = new AWS.SSM({
  region: process.env.PARAM_STORE_REGION || 'us-east-1',
});

// it is currently assumed that the only type of credentials that will be
// requested is client_credentials
const GRANT_TYPE = 'client_credentials';

/**
 * get Parameter Store value
 *
 * @param {AWS.SSM.Types.GetParameterRequest} paramRequest
 * @return {string} value as stored in Parameter Store
 */
async function getParam(paramRequest) {
  const getReq = ssmClient.getParameter(paramRequest);
  try {
    const response = await getReq.promise();
    return response.Parameter.Value;
  } catch (err) {
    console.warn(err);
    return;
  }
}

/**
 * write to Parameter Store
 *
 * @param {AWS.SSM.Types.PutParameterRequest} paramRequest
 */
async function putParam(paramRequest) {
  const putReq = ssmClient.putParameter(paramRequest);
  try {
    await putReq.promise();
    console.debug('successfully updated parameter');
  } catch (err) {
    console.warn(err);
  }
}

/**
 * async function responsible for retrieving and store
 * valid OAuth2 access tokens into the AWS Parameter Store.
 *
 * @param {string} oauthKey Oauth Key as configured via environment variable
 * @return {string} valid access token based on configured OAuth server
 */
async function getAndSaveToken(oauthKey) {
  const secrets = await getParam({
    Name: `/oauth/${oauthKey}/secrets`,
    WithDecryption: true,
  });

  if (!secrets) {
    throw new Error(
      `no secrets in Parameter Store defined for key ${oauthKey}`);
  }

  const parsedSecrets = JSON.parse(secrets);

  const buff = Buffer.from(
    `${parsedSecrets.clientId}:${parsedSecrets.clientSecret}`);
  const base64Creds = buff.toString('base64');

  const expirationDate = new Date();

  const tokenResp = await p({
    url: parsedSecrets.endpoint,
    parse: 'json',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Creds}`,
    },
    form: {
      'grant_type': GRANT_TYPE,
    },
  });

  const tokenRespBody = tokenResp.body;

  if (!tokenRespBody || !tokenRespBody['access_token'] ||
      !tokenRespBody['expires_in']) {
    throw new Error('Invalid token response');
  }

  // set token expiration to be 2 minutes before stated expiration
  expirationDate.setSeconds(
    expirationDate.getSeconds() + tokenRespBody['expires_in'] - 120);

  const tokenVal = {
    token: tokenRespBody['access_token'],
    expiration: expirationDate.getTime(),
  };

  const tokenSsmParams = {
    Name: `/oauth/${oauthKey}/token`,
    Type: 'SecureString',
    Value: JSON.stringify(tokenVal),
    Overwrite: true,
  };

  await putParam(tokenSsmParams);
  return tokenVal.token;
}


/**
 * Responsible for retrieving an access token from
 * either the Parameter Store or directly from the OAuth server. This
 * function assumes that you'll pass a key as configured inside
 * of the parameter store and will return a function guaranteed
 * to always return a valid token for that key.
 *
 * usage:
 *
 *  // initialize getOAuthToken with key
 * const getBlackboardToken = getOAuthToken('blackboard');
 *
 * // get valid blackboard token
 * const validToken = await getBlackboardToken()
 *
 * @return {function(): string} async function returning valid token
 *
 */

export function getOAuthToken(oauthKey) {
  if (!oauthKey || oauthKey.length === 0) {
    throw new Error('please pass a valid OAuth key');
  }

  console.debug('retrieving oauth credentials for:', oauthKey);

  return async () => {
    // look for token from parameter store
    const storedToken = await getParam({
      Name: `/oauth/${oauthKey}/token`,
      WithDecryption: true,
    });

    const parsedToken = storedToken ? JSON.parse(storedToken) : null;

    // if token doesn't yet exist or is expired, get and return
    if (!parsedToken ||
          !parsedToken['expiration'] ||
          parsedToken['expiration'] < Date.now()) {
      return await getAndSaveToken(oauthKey);
    }

    return parsedToken.token;
  };
}

