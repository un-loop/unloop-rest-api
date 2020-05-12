import {notFound, badRequest} from '../libs/buildResponse';
import httpMethods from '../libs/httpMethods';
import normalizeUrl from 'normalize-url';

const beginningSlashes = /^\/+/;
const separatorRegex = /\/+/;
const tokenRegex = /%7B\w+%7D/;

const testToken = (str) => {
  return str && str.match(tokenRegex);
};

const canonicalizePath = (path) => {
  return normalizeUrl(
    path.replace(beginningSlashes, ''),
    {
      stripProtocol: true,
      stripHash: true,
      removeQueryParameters: true,
      removeTrailingSlash: true,
    },
  );
};

const resourceRouter = (routes) => (event) => {
  const pathParts = canonicalizePath(event.resource).split(separatorRegex);

  let pathIndex = 0;
  let foundRoute = routes;
  let foundToken;

  while (pathIndex < pathParts.length) {
    const resourceName = pathParts[pathIndex];

    if (!foundRoute ||
      !Object.prototype.hasOwnProperty.call(foundRoute, resourceName)) {
      return notFound(`'${resourceName}' resource not found in path ${
        event.path
      }`);
    }

    foundRoute = foundRoute[resourceName];

    foundToken = testToken(pathParts[++pathIndex]);
    if (foundToken) {
      pathIndex++;
    }
  }

  let action;
  switch (event.httpMethod) {
    case httpMethods.GET: {
      action = foundToken ?
        foundRoute.get : foundRoute.getAll;
      break;
    }

    case httpMethods.PUT: {
      if (!foundToken) {
        return badRequest('Update requires an id.');
      }
      action = foundRoute.update;
      break;
    }
    case httpMethods.CREATE: {
      if (foundToken) {
        return badRequest('Create does not take an id.');
      }
      action = foundRoute.create;
      break;
    }
    case httpMethods.DELETE: {
      if (!foundToken) {
        return badRequest('Remove requires and id.');
      }
      action = foundRoute.remove;
      break;
    }
    case httpMethods.POST: {
      action = foundRoute.post;
      break;
    }
  }
  return action(event);
};

export default resourceRouter;
