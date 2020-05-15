import {StatusCode} from './statusCodes';

export interface HTTPResponse {
  statusCode: StatusCode
  headers: object
  body: string
}

type ResponseWithContent = (body:object) => HTTPResponse
type ResponseWithError = (msg:string) => HTTPResponse

export const buildResponse = (responseCode: StatusCode) => (body?: any) => {
  if (responseCode === StatusCode.NO_CONTENT && body !== undefined) {
    throw new Error('No content does not take in a body');
  }

  return {
    statusCode: responseCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: body === undefined ? body : JSON.stringify(body),
  };
};

export const buildErrorResponse = (responseCode: StatusCode) => (msg: string) => {
  return buildResponse(responseCode)({message: msg})
}

export const success: ResponseWithContent  = buildResponse(StatusCode.SUCCESS);
export const created: ResponseWithContent = buildResponse(StatusCode.CREATED);
export const noContent: () => HTTPResponse = buildResponse(StatusCode.NO_CONTENT);

export const failure: ResponseWithError = buildErrorResponse(StatusCode.INTERNAL_ERROR);
export const notFound: ResponseWithError = buildErrorResponse(StatusCode.NOT_FOUND);
export const badRequest: ResponseWithError = buildErrorResponse(StatusCode.BAD_REQUEST);
