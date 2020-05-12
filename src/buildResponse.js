import statusCodes from './statusCodes';

const buildResponse = (responseCode) => (body) => {
  return {
    statusCode: responseCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },

    body: JSON.stringify(body),
  };
};

export default buildResponse;

export const success = buildResponse(statusCodes.SUCCESS);
export const failure = buildResponse(statusCodes.INTERNAL_ERROR);
export const notFound = buildResponse(statusCodes.NOT_FOUND);
export const badRequest = buildResponse(statusCodes.BAD_REQUEST);
export const created = buildResponse(statusCodes.CREATED);
