import p from 'phin';
import {HTTPMethod} from './httpMethods';

const REQUEST_TIMEOUT_MILLIS = 2000;

const getPhinClient = (method: HTTPMethod) => (token: string) => {
  // @ts-ignore
  return p.defaults({
    method: method,
    parse: 'json',
    timeout: REQUEST_TIMEOUT_MILLIS,
    headers: {Authorization: `Bearer ${token}`},
  });
};

/**
 * Add query parameters to a url
 *
 * @param {string} base full existing url to add query args to
 * @param {object} queryParams query args to add to url
 * @return {string}
 *
 * @example
 *
 *  let urlWithParams = buildQueryParamUrl("https://localhost:3000/announcements", {limit: 5, sort: "asc"})
 *  console.log(urlWithParams) // https://localhost:3000/announcements?limit=4&sort=asc
 */
export const buildQueryParamUrl = (base: string, queryParams: any) => {
  const url = new URL(base);
  const queryParamsURL = new URLSearchParams(queryParams);
  url.search = queryParamsURL.toString();
  return url.toString();
};

/**
 * return an authenticated default post client
 * @param {string} oauth token to use
 * @return {function} authenticated function for making post call
 *
 * @example
 *
 *  let authedPost = authorizePost(await getBlackboardToken());
 *  authedPost({url: 'http://localhost:3000'})
 */
export const authorizePost = getPhinClient(HTTPMethod.POST);

/**
 * return an authenticated default get client
 * @param {string} oauth token to use
 * @return {function} authenticated function for making authorizeGet call
 *
 * @example
 *
 *  let authedGet = authorizeGet(await getBlackboardToken());
 *  authedGet({url: 'http://localhost:3000'})
 */
export const authorizeGet = getPhinClient(HTTPMethod.GET);
export const authorizePut = getPhinClient(HTTPMethod.PUT);
export const authorizePatch = getPhinClient(HTTPMethod.PATCH);

//we have to do this for delete because when delete returns 204 no content, phin client crashes
//waiting on PR https://github.com/ethanent/phin/pull/38
export const authorizeDelete = (token: string) => {
  // @ts-ignore
  return p.defaults({
        method: HTTPMethod.DELETE,
        timeout: REQUEST_TIMEOUT_MILLIS,
        headers: {Authorization: `Bearer ${token}`}
    })
};
