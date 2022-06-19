import {db} from "./index";
import fetch from "node-fetch";
import * as functions from "firebase-functions";
const appDataCollection = "app-data";

interface AppDataInterface {
  appId: string,
  appSecret: string,
  grantType: string,
  verifyToken: string

}

interface AuthResponse {
  access_token: string,
  token_type: string
}

/**
 * TODO --> put something meaningfull here
 */
export class FBAuthService {
  private appId: string;
  private appSecret: string;
  private grantType: string;
  private verifyToken: string;
  // private authResponse: Promise<AuthResponse> | null;
  private authUrl = "https://graph.facebook.com/oauth/access_token";
  /**
     *
     * @param {AppDataInterface}appData: initialize the class with appdata
     */
  constructor(appData: AppDataInterface) {
    functions.logger.info("something", appData);
    this.appId = appData.appId;
    this.appSecret = appData.appSecret;
    this.grantType = appData.grantType;
    this.verifyToken = appData.verifyToken;
    // this.authResponse = null;
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
   * @param {Promise<FBAuthService>} authPromise
   * @return {Promise<FBAuthService>}
   */
  public static async getFBAuthService(
      authPromise: Promise<FBAuthService>): Promise<FBAuthService> {
    return await authPromise;
  }

  /**
   *
   * @return {Promise<AuthResponse>} returns the authentication token
   */
  public getAuthToken(): Promise<AuthResponse> {
    const url =
      `${this.authUrl}/client_id=${this.appId}
    &client_secret=${this.appSecret}
    &grant_type=${this.grantType}`;

    const authData = fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to authenticate");
          }
          return response.json();
        })
        .then((responseData) => responseData as AuthResponse);
    // this.authResponse = authData;
    return authData;
  }

  /**
   *
   * @return {string} accessor for verify token
   */
  getVerifyToken() {
    return this.verifyToken;
  }
}
