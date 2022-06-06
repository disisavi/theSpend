import {db} from "./index";
import {DocumentData} from "firebase-admin/firestore";

/**
 *
 * @param {string} collectionName
 * presents name of the collection to add the document to
 *
 * @param {unknown} data presents data to be persisted;
 * @return {Promise<string>} Returns the ID of the doc
 */
export function writeToCollection(
    collectionName: string, data: unknown): Promise<string> {
  return db
      .collection(collectionName)
      .add(data as DocumentData)
      .then((reference)=> reference.id);
}
