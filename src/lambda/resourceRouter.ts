import {notFound, badRequest} from '../buildResponse';
import HTTPMethod from '../httpMethods';
import normalizeUrl from 'normalize-url';
import {ApiGatewayEvent, ResourceFunction, RouteResource} from './models';

const beginningSlashes = /^\/+/;
const separatorRegex = /\/+/;
const tokenRegex = /%7B\w+%7D/;

const testToken = (str: string) => {
  return str && str.match(tokenRegex);
};

const canonicalizePath = (path: string) => {
  return normalizeUrl(
    path.replace(beginningSlashes, ''),
    {
      stripProtocol: true,
      stripHash: true,
      // TODO: review - removeQueryParameters takes in a regex, uses [/^utm_\w+/i] by default
      // removeQueryParameters: true,
      removeTrailingSlash: true,
    },
  );
};


const resourceRouter = (routes: RouteResource) => (event: ApiGatewayEvent) => {
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

    //TODO: fix this after using it inside of blackboard project
    //so it stops yelling at me
    foundRoute = foundRoute[resourceName];

    foundToken = testToken(pathParts[++pathIndex]);
    if (foundToken) {
      pathIndex++;
    }
  }

  //TODO: fix this
  let action: ResourceFunction | undefined

  switch (event.httpMethod) {
    case HTTPMethod.GET: {
      action = foundToken ?
        foundRoute.get : foundRoute.getAll;
      break;
    }

    case HTTPMethod.PUT: {
      if (!foundToken) {
        return badRequest('Update requires an id.');
      }
      action = foundRoute.update;
      break;
    }
    case HTTPMethod.DELETE: {
      if (!foundToken) {
        return badRequest('Remove requires an id.');
      }
      action = foundRoute.remove;
      break;
    }
    case HTTPMethod.POST: {
      action = foundRoute.post;
      break;
    }
  }

  return action(event);
};

export default resourceRouter;
