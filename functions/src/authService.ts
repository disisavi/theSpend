import {db} from "./index";
import * as functions from "firebase-functions";

const appDataCollection = "app-data";

interface AppDataInterface {
  appId: string,
  appSecret: string,
  grantType: string,
  verifyToken: string
  phoneNumberId:string
  fbAccessToken: string
}


/**
 * TODO --> put something meaningfull here
 */
export class FBAuthService {
  private appId: string;
  private appSecret: string;
  private grantType: string;
  private verifyToken: string;
  private fbPhoneNumberID: string;
  private fbAccessToken: string;
  // private authResponse: Promise<AuthResponse> | null;
  private authUrl = "https://graph.facebook.com/oauth/access_token";
  /**
     *
     * @param {AppDataInterface}appData: initialize the class with appdata
     */
  constructor(appData: AppDataInterface) {
    functions.logger.info("Initialize FBAuthService with data --", appData);
    this.appId = appData.appId;
    this.appSecret = appData.appSecret;
    this.grantType = appData.grantType;
    this.verifyToken = appData.verifyToken;
    this.fbPhoneNumberID= appData.phoneNumberId;
    this.fbAccessToken = appData.fbAccessToken;
  }

  /**
     *
     * @return {Promise<FBAuthService>} instantiates and returns a FBAuthService
     */
  public static initializeAppData(): Promise<FBAuthService> {
    return db.collection(appDataCollection)
        .doc("fb-data").get()
        .then((document) => document.data() as AppDataInterface)
        .then((appdata) => new FBAuthService(appdata));
  }


  /**
   *
   * @return {string}
   */
  public getAuthToken(): string {
    return this.fbAccessToken;
  }

  /**
   *
   * @return {string} accessor for verify token
   */
  getVerifyToken() {
    return this.verifyToken;
  }

  /**
   *
   * @return {string}
   */
  getPhoneNumberId(): string {
    return this.fbPhoneNumberID;
  }
}
