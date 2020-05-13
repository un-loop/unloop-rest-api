import { HTTPResponse } from "../buildResponse";

//loose wrapper around API Gateway event: https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html
export interface ApiGatewayEvent {
  resource: string
  path: string
  httpMethod: string
  queryStringParameters: object
  body: any
}

//TODO: update this because it will always have a build response response type
export type ResourceFunction = (event?: ApiGatewayEvent) => HTTPResponse;

export interface RouteResource {
  get?: ResourceFunction
  getAll?: ResourceFunction
  update?: ResourceFunction
  create?: ResourceFunction
  remove?: ResourceFunction
  post?: ResourceFunction
}
