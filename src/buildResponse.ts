import StatusCode from './statusCodes';

export interface HTTPResponse {
  statusCode: StatusCode
  headers: object
  body: string
}

type ResponseWithContent = (body:object) => HTTPResponse
type ResponseWithError = (msg:string) => HTTPResponse

//TODO: review - type object does NOT allow for values like null/undefined
//see more here: https://www.typescriptlang.org/docs/handbook/basic-types.html#object
const buildResponse = (responseCode: StatusCode) => (body?: any) => {
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

const buildErrorResponse = (responseCode: StatusCode) => (msg: string) => {
  return buildResponse(responseCode)({message: msg})
}

export default buildResponse;

export const success: ResponseWithContent  = buildResponse(StatusCode.SUCCESS);
export const created: ResponseWithContent = buildResponse(StatusCode.CREATED);
export const noContent: () => HTTPResponse = buildResponse(StatusCode.NO_CONTENT);

//unsuccessful states take in a string and will be formatted into
//{message: ERROR_MSG}
export const failure: ResponseWithError = buildErrorResponse(StatusCode.INTERNAL_ERROR);
export const notFound: ResponseWithError = buildErrorResponse(StatusCode.NOT_FOUND);
export const badRequest: ResponseWithError = buildErrorResponse(StatusCode.BAD_REQUEST);
