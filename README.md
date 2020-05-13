# Unloop Rest API

This library contains utility functions needed by various REST API's. 

They are as follows: 

TODO: FINISH WRITING THIS


## OAuth

Based on configured properties inside of AWS Parameter Store, this library is guaranteed to always return a valid OAuth token for either  [client credentials](https://oauth.net/2/grant-types/client-credentials/) or [JWT](https://oauth.net/2/jwt/). 

### Before using

Before being referenced inside of your project, it is assumed that the following is configured inside of AWS Parameter Store. 

**key**:

`/oauth/OAUTH_KEY/TYPE/secrets`

`OAUTH_KEY` must match with the `OAUTH_KEY` parameter passed to the `getOAuthToken` function.

`TYPE` should be one of two values - `client_credentials` or `jwt`

**value**:

`{"clientId": "CLIENT_ID", "clientSecret": "CLIENT_SECRET","endpoint":"TOKEN_ENDPOINT"}`

The `CLIENT_ID`, `CLIENT_SECRET`, and `TOKEN_ENDPOINT` should be the given to you by your OAuth provider. This value is assumed to be of type `SecureString` and secured using the default KMS associated with your AWS account. 

### Usage

The wbw-oauth library can be imported with either: 

```
import oauth from 'wbw-oauth'

import {jwt, clientCredentials} from 'wbw-oauth'
```

After import, if my Parameter Store is configured to contain both client_credentials and jwt secrets for the key `zoom`, I could get tokens for both auth types as such: 

```
//two methods that can now be used anywhere and guaranteed to return
//valid tokens
const getZoomJWT = oauth.jwt('zoom');
const getZoomClientCredentials = oauth.clientCredentials('zoom');

//any time that you need a valid token, you can call them as follows:
const validJWTToken = await getZoomJWT()
const validClientCredentialsToken = await getZoomClientCredentials()

```

*functions jwt() and clientCredentials() in the above examples both returns a promise, notice in the above example we call **await** before calling getZoomJWT and getZoomClientCredentials.*

Typically you won't need to retrieve two types of OAuth tokens. For example, if I just needed the ability to get JWT tokens I could do:

```
import {jwt} from 'wbw-oauth';

const getZoomJWT = jwt('zoom');
```

In the above example, for anywhere where I'd need a valid token (for example, inside of an http request) I can call the function `await getZoomJWT()`


### How it works

When a valid client_credentials token is obtained, it is stored inside of AWS Parameter Store under the key `/oauth/OAUTH_KEY/client_credentials/token`. You can confirm that retrieving the token was successful by checking inside of the Parameter Store. JWT tokens are not stored inside of the Parameter Store in any way and are set to expire within 5 minutes. 

### Accepted Environment Variables
| Environment Variable | Default | Definition |
| --- | --- | --- |
| PARAM_STORE_REGION | us-east-1 | the region associated with your AWS parameter Store |