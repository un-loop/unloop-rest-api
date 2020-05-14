# Unloop Rest API

This library contains utility functions needed by various REST API's. 

They're divided as follows: 

## http

Utility classes representing HTTP Status Codes and methods. 
   *  **StatusCode**
   *  **HTTPMethod**

helper function for building URL's with query parameters 
   *  **buildQueryParamUrl**

A thin wrapper around a phin client that takes in a bearer token and can be reused to perform authorized requests on the specified URL
   *  **authorizeGet**
   *  **authorizePost**
   *  **authorizePut**
   *  **authorizePatch**
   *  **authorizeDelete**

functions taking in a body object that returns a formatted HTTP response object with the appropriate status code and CORS headers. If a body is passed, it will automatically be json formatted. noContent() will throw an error if a body is passed. 
   *  **success**
   *  **created**
   *  **noContent**

functions taking in a body object that returns a formatted HTTP response object with the appropriate status code and CORS headers. If an error message is passed, it will be automatically formatted into {message: ERROR_MESSAGE} and returned to the user. 
   *  **failure**
   *  **notFound**
   *  **badRequest**

helper function to build json formatted HTTP responses, takes in a status code and returns a function taking in a body object. You shouldn't need to use this often as we provide sucess/created/noContent response wrappers. 
   *  **buildResponse**

helper function to build json formatted HTTP error responses, takes in a status code and returns a function taking in an error message string that will be automatically wrapped in the body {message: ERROR_MESSAGE}. You shouldn't need to use this often as we provide failure/notFound/badRequest response wrappers. 
   *  **buildErrorResponse**


## lambda

Helps to resolve lambda paths to resources with get/getAll/update/remove/post functions. Matches based on resource name. 
   *  **resourceRouter**


## oauth

Assuming oauth credentials are stored in the expected format inside of AWS Parameter Store, provides the ability to retrieve both jwt and client credential tokens. See README inside of the oauth folder for additional details on setup and usage.

   *  **jwt**
   *  **clientCredentials**

## usage

This library can be imported and used inside of your project as follows: 

Importing the entire library: 

```
import * as lib from 'unloop-rest-api';

console.log('string get method', lib.HTTPMethod.GET);
console.log('failure response object', lib.failure('fail'));
```

As named imports: 

```
import {http, lambda} from 'unloop-rest-api';

console.log('string get method', http.HTTPMethod.GET);
console.log('failure response object', lambda.resourceRouter(ROUTES));
```


```
import {HTTPMethod, resourceRouter} from 'unloop-rest-api';

console.log('string get method', HTTPMethod.GET);
console.log('failure response object', resourceRouter(ROUTES));
```
