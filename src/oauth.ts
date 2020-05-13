const AWS = require('aws-sdk');
const p = require('phin');
var jwtLib = require('jsonwebtoken');

// initialize new AWS Systems Manager client with region
const ssmClient = new AWS.SSM({
  region: process.env.PARAM_STORE_REGION || 'us-east-1',
});

const auth = {
  CC: "client_credentials",
  JWT: "jwt"
}

const DEFAULT_EXPIRY_MILLIS = 300000;

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
 * valid OAuth2 client credentials access tokens into the AWS Parameter Store.
 *
 * @param {string} oauthKey Oauth Key as configured via environment variable
 * @return {string} valid access token based on configured OAuth server
 */
async function getAndSaveToken(oauthKey) {
  const secrets = await getParam({
    Name: `/oauth/${oauthKey}/${auth.CC}/secrets`,
    WithDecryption: true,
  });

  if (!secrets) {
    throw new Error(
      `no secrets in Parameter Store defined for key ${oauthKey}, type ${auth.CC}`);
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
      'grant_type': auth.CC,
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
    Name: `/oauth/${oauthKey}/${auth.CC}/token`,
    Type: 'SecureString',
    Value: JSON.stringify(tokenVal),
    Overwrite: true,
  };

  await putParam(tokenSsmParams);
  return tokenVal.token;
}

/**
 * Generates a JWT token based on the default expiration of
 * 5 minutes and passed api key + secret
 *
 * @param {*} apiKey JWT API Key
 * @param {*} apiSecret JWT API secret
 * @return {string} valid JWT token
 */
function generateJWTToken(apiKey, apiSecret) {
  const expiryTime = new Date().getTime() + DEFAULT_EXPIRY_MILLIS;
  const payload = {
    iss: apiKey,
    exp: expiryTime
  }
  const token = jwtLib.sign(payload, apiSecret);
  return token
}

function checkKey(oauthKey) {
  if (!oauthKey || oauthKey.length === 0) {
    throw new Error('please pass a valid OAuth key');
  }

  console.debug('retrieving oauth credentials for:', oauthKey);
}

export function jwt(oauthKey) {
  checkKey(oauthKey);

  return async () => {
    const secrets = await getParam({
      Name: `/oauth/${oauthKey}/${auth.JWT}/secrets`,
      WithDecryption: true,
    });

    if (!secrets) {
      throw new Error(
        `no secrets in Parameter Store defined for key ${oauthKey}, type ${auth.JWT}`);
    }

    const parsedSecrets = JSON.parse(secrets);
    return generateJWTToken(parsedSecrets.apiKey, parsedSecrets.apiSecret);
  }
}

export function clientCredentials(oauthKey) {
    checkKey(oauthKey);

    return async () => {
      // look for token from parameter store
      const storedToken = await getParam({
        Name: `/oauth/${oauthKey}/${auth.CC}/token`,
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
    }
}

/**
 * Responsible for retrieving a valid access token from
 * either the Parameter Store or directly from the OAuth server.
 * The requested token can be either type jwt or client credentials.
 *
 * usage:
 *
 * import oauth from 'wbw-oauth'
 *
 * // ex: retrieving blackboard token of type client_credentials
 * const getBlackboardClientToken = oauth.clientCredentials('blackboard');
 * const validClientToken = await getBlackboardClientToken;
 *
 * See README for additional examples
 *
 * @return {function(): string} async function returning valid token
 *
 */
export default {jwt, clientCredentials}

