import {FunctionResponse, PostRequest, requestLogCollection,
  requestMessageCollection, messageRecord}
  from "./entities";
import {Request} from "firebase-functions/v1";
import * as functions from "firebase-functions";
import * as db from "./databaseAccess";

/**
 *
 * @param {Request} postRequest: This is the request we will get from Webhook
 * @return {FunctionResponse}: Response to this request
 */
export async function
postHandler(postRequest:Request):Promise<FunctionResponse> {
  const FbWebhookMessage: PostRequest = postRequest.body as PostRequest;
  functions.logger.info(postRequest.body??"asd");
  const requestRef:Promise<string> = db.writeToCollection(
      requestLogCollection, FbWebhookMessage);

  let message: string;
  try {
    message = FbWebhookMessage
        .entry[0]
        .changes[0]
        .value
        .messages[0]
        .text
        .body;
  } catch (exception) {
    functions.logger.error("Unstructred message.", exception);
    message = "N/A";
  }
  functions.logger.info(`Message is == ${message}`);
  const requestId = await requestRef;
  const messageRef:string = await db
      .writeToCollection(
          requestMessageCollection(requestId), messageRecord(message));
  functions.logger.error(`${messageRef} + ${requestId}`);
  return {
    message: `${messageRef}`,
    httpStatus: 201,
  };
}
