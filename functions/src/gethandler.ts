import {Request} from "firebase-functions";
import * as functions from "firebase-functions";
import {FunctionResponse, verifyToken} from "./entities";
/**
 * handler for the GET Http method
 * @param {Request} getRequest -- Well, This is the request.
 * @return {FunctionResponse} The FunctionResponse
 * once the function has been evaluated
 */
export function getHandler(getRequest:Request):FunctionResponse {
  functions.logger.info("Inside the get Handler");
  const params = getRequest.query;
  const responseMessage: FunctionResponse = {
    message: "This is an Incorrect request",
    httpStatus: 500,
  };
  if ((params["hub.challenge"] != undefined)&&
   (params["hub.verify_token"] == verifyToken)) {
    responseMessage.message = params["hub.challenge"] as string;
    responseMessage.httpStatus = 200;
  } else {
    const queryString = Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join(" & ");

    functions.logger.debug(
        `Request failed with params ${queryString}`, {structuredData: true});
  }
  return responseMessage;
}

