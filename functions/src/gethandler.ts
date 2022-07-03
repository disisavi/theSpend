import {Request} from "firebase-functions";
import * as functions from "firebase-functions";
import {FunctionResponse} from "./entities";
import {authService as authPromise} from "./index";
/**
 * handler for the GET Http method
 * @param {Request} getRequest -- Well, This is the request.
 * @return {Promise<FunctionResponse>} The FunctionResponse
 * once the function has been evaluated
 */
export async function getHandler(getRequest:Request) {
  functions.logger.info("Inside the get Handler");
  const params = getRequest.query;
  const responseMessage: FunctionResponse = {
    message: "This is an Incorrect request",
    httpStatus: 500,
  };

  const authService =await authPromise;
  if ((params["hub.challenge"] != undefined)&&
   (params["hub.verify_token"] == authService.getVerifyToken())) {
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

