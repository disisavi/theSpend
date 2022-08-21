import {FBAuthService} from "./authService";
import {FBMessageRequest, MessageRequest} from "./entities";
import * as functions from "firebase-functions";
import fetch from "node-fetch";
import {authService} from ".";
/**
 *f
 */
export class FBService {
  private fbAuthService:Promise<FBAuthService>;

  /**
   *constructor
   */
  constructor() {
    this.fbAuthService = authService;
  }
  /**
   *
   * @param {MessageRequest} messageRequest
   */
  public async sendMessage(messageRequest: MessageRequest) {
    const fbMessageRequest: FBMessageRequest = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: messageRequest.phoneNumber,
      context: {
        message_id: messageRequest.messageId,
      },
      type: "text",
      text: {
        preview_url: false,
        body: messageRequest.message,
      },
    };
    const header = {
      "Accept": "application/json",
      "Authorization": await this.getBearerToken(),
      "Content-Type": "application/json",
    };
    const url =`https://graph.facebook.com/v13.0/${(await this.fbAuthService).getPhoneNumberId()}/messages`;
    functions.logger.debug(url, header);
    functions.logger.debug("Message to FB is ", fbMessageRequest);
    fetch(url, {
      method: "POST",
      headers: header,
      body: JSON.stringify(fbMessageRequest),
    })
        .then((response)=> {
          if (response.status != 200) {
            response.json().then((message)=> {
              functions.logger.error("Failed to send message");
              functions.logger.error(message);
            });
            throw new Error("Could not send the message");
          }
          functions.logger.info("Messge Sent Successfully");
          response.json().then((message)=> functions.logger.info(message));
        })
        .catch((error)=> {
          functions.logger.error("Failed to send message -- ", (error as Error));
        });
  }

  /**
   *
   * @return {Promise<string>}
   */
  private async getBearerToken():Promise<string> {
    return this.fbAuthService
        .then((authService)=> `Bearer ${authService.getAuthToken()}`);
  }
}
