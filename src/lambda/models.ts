import { HTTPResponse } from "../buildResponse";

//loose wrapper around API Gateway event: https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html
export interface ApiGatewayEvent {
  resource: string
  path: string
  httpMethod: string
  queryStringParameters: object
  body: any
}

export type ResourceFunction = (event?: ApiGatewayEvent) => HTTPResponse;

export interface RouteResource {
  get?: ResourceFunction
  getAll?: ResourceFunction
  update?: ResourceFunction
  create?: ResourceFunction
  remove?: ResourceFunction
  post?: ResourceFunction
}
