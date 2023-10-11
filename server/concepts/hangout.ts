import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

// Define the structure for the Hangout document in MongoDB.
export interface HangoutDoc extends BaseDoc {
  author: ObjectId;
  date: string;
  activity: string;
  location: string;
  acceptee: Array<ObjectId>;
  suggestion: Array<[ObjectId, Partial<HangoutDoc>]>;
}

export default class HangoutConcept {

  // Initialize a new collection for hangout documents in MongoDB.
  public readonly hangouts = new DocCollection<HangoutDoc>("hangouts");
  
  /**
   * Propose a new hangout.
   * @param author - ObjectId of the user proposing the hangout.
   * @param date - Date for the hangout.
   * @param activity - Activity for the hangout.
   * @param location - Location for the hangout.
   * @returns A message indicating hangout creation and the created hangout.
   */
  async createHangout(author: ObjectId, date: string, activity: string, location: string) {
    const validity = this.validateInputs({activity,location,date},true)
    if(validity.isValid){
      const _id = await this.hangouts.createOne({ author, date, activity, location, acceptee: [], suggestion: [] });
      return { msg: "Hangout proposed", hangout: await this.hangouts.readOne({ _id }) };
    }
    return {msg: validity.message}
  }

  /**
   * Retrieve hangouts created by the user 
   * @param user - ObjectId of the user.
   * @returns A list of hangouts.
   */
  async getHangoutCreated(user: ObjectId) {
    const hang = await this.hangouts.readMany({ author: user });// Hangouts created by the user.
    return { hangout: hang };
  }

  /**
   * Retrieve hangouts accepted by the user 
   * @param user - ObjectId of the user.
   * @returns A list of hangouts.
   */
  async getHangoutAccepted(user: ObjectId){
    const hang = await this.hangouts.readMany({ acceptee: { $elemMatch: { $eq: user } } } );// Hangouts accepted by the user.
    return { hangout: hang };
  }

  /**
   * Delete a hangout by its ID.
   * @param _id - ObjectId of the hangout to delete.
   * @returns A message indicating successful deletion.
   */
  async deleteHangout(author: ObjectId, _id: ObjectId) {
    const hangout = await this.hangouts.readOne({ _id}); 

    if (hangout && (author.toHexString() !== hangout.author.toHexString())) {
      return new NotAllowedError('You are not the author of this hangout!');
    }

    if(! hangout){
      return new NotFoundError("This hangout does not exist!");
    }

    await this.hangouts.deleteOne({ _id });
    return { msg: "Hangout deleted successfully" };
  }

  /**
   * Accept a hangout invitation.
   * @param _id - ObjectId of the hangout to accept.
   * @param acceptee - ObjectId of the user accepting the hangout.
   * @returns A message indicating the acceptance status.
   */
  async acceptHangout(_id: ObjectId, acceptee: ObjectId) {
    const hangout = await this.hangouts.readOne({ _id});

    if (hangout) {
      // Ensure the acceptee is not the author of the hangout.
      if (acceptee.toHexString() == hangout.author.toHexString()) {
        return new NotAllowedError('You cannot accept your own hangout.');
      }

      if (await this.hangouts.readOne({ _id, acceptee:{$in:[acceptee]} })){
        return new NotAllowedError("You have already said yes to this hangout");
      }

      hangout.acceptee.push(acceptee);
      await this.hangouts.updateOne({ _id }, hangout);
      return { msg: "You have accepted hangout" };
    }

    return new NotFoundError("This hangout does not exist!");
  }

  /**
   * Get the author of a hangout.
   * @param _id - ObjectId of the hangout.
   * @returns The ObjectId of the author.
   */
  async getAuthor(_id: ObjectId) {
    return (await this.hangouts.readOne({ _id }))?.author;
  }

  /**
   * Directly edit a hangout.
   * Only the author of the hangout can make direct edits.
   * @param _id - ObjectId of the hangout.
   * @param editor - ObjectId of the user trying to edit the hangout.
   * @param update - Updates to the hangout.
   * @returns A message indicating the status of the edit.
   */
  async editHangout(_id: ObjectId, editor: ObjectId, update: Partial<HangoutDoc>) {
    const hangout = await this.hangouts.readOne({ _id });

    if (!hangout) {
      return new NotFoundError("This hangout does not exist!");
    }

    const validity = this.validateInputs(update,false);

    if(!validity.isValid){
      return {msg: validity.message}
    }

    // Ensure only the author can edit the hangout
    if (editor.toHexString() !== hangout.author.toHexString()) {
        throw new NotAllowedError(`You are not authorized to edit this hangout
         You are ${editor} and not ${hangout.author}`);
    }

    await this.hangouts.updateOne({ _id }, update);
    return { msg: "Hangout edited successfully" };
  }

  /**
  * Suggest edits to a hangout.
  * Anyone can suggest edits. These suggestions will be stored for review without directly modifying the hangout.
  * @param _id - ObjectId of the hangout.
  * @param suggestor - ObjectId of the user making the suggestion.
  * @param update - Proposed updates to the hangout.
  * @returns A message indicating the status of the suggestion.
  */
  async suggestHangoutEdit(_id: ObjectId, suggestor: ObjectId, update: Partial<HangoutDoc>) {
    const hangout = await this.hangouts.readOne({ _id });

    if (!hangout) {
      return new NotFoundError("This hangout does not exist!");
    }

    const validity = this.validateInputs(update,false);

    if(!validity.isValid){
      return {msg: validity.message}
    }

    // Record the suggestion for review
    hangout.suggestion.push([suggestor, update]);
    await this.hangouts.updateOne({ _id }, hangout);
    return { msg: "Your suggestion has been recorded", hangout: await this.hangouts.readOne({ _id }) };
  }

  /**
   * Accept a hangout edit suggestion and update the hangout.
   * @param _id - ObjectId of the hangout.
   * @param suggestionIndex - Index of the suggestion to accept, 0-indexed
   * @returns A message indicating the status of the suggestion acceptance.
   */
  async acceptSuggestion(_id: ObjectId, acceptor: ObjectId, suggestionIndex: number) {
    const hangout = await this.hangouts.readOne({ _id });

    if (!hangout) {
      return new NotFoundError("This hangout does not exist!");
    }

    // Ensure only the author can edit the hangout
    if (acceptor.toHexString() !== hangout.author.toHexString()) {
      throw new NotAllowedError(`You are not authorized to clear the suggestion
       You are ${acceptor} and not ${hangout.author}`);
    }

    if (suggestionIndex >= 0 && suggestionIndex < hangout.suggestion.length) {
      const [_, update] = hangout.suggestion[suggestionIndex];

      // Update the hangout document with the accepted suggestion
      await this.hangouts.updateOne({ _id }, update);
      
      // Now, remove the accepted suggestion
      hangout.suggestion.splice(suggestionIndex, 1);
      await this.hangouts.updateOne({ _id }, {suggestion: hangout.suggestion});

      return { msg: "Suggestion accepted and hangout updated successfully", hangout: await this.hangouts.readOne({_id})};
    }

    throw new NotAllowedError('Invalid suggestion index provided');
  }

  /**
   * Accept a hangout edit suggestion and update the hangout.
   * @param _id - ObjectId of the hangout.
   * @param suggestionIndex - Index of the suggestion to accept, 0-indexed
   * @returns A message indicating the status of the suggestion acceptance.
   */
  async declineSuggestion(_id: ObjectId, editor: ObjectId, suggestionIndex: number) {
    const hangout = await this.hangouts.readOne({ _id });

    if (!hangout) {
      throw new NotFoundError('This hangout does not exist');
    }

    // Ensure only the author can edit the hangout
    if (editor.toHexString() !== hangout.author.toHexString()) {
      throw new NotAllowedError(`You are not authorized to clear the suggestion
       You are ${editor} and not ${hangout.author}`);
    }

    if (suggestionIndex >= 0 && suggestionIndex < hangout.suggestion.length) {
      // Now, remove the accepted suggestion
      hangout.suggestion.splice(suggestionIndex, 1);
      await this.hangouts.updateOne({ _id }, {suggestion: hangout.suggestion});

      return { msg: "Suggestion removed and hangout updated successfully", hangout: await this.hangouts.readOne({_id})};
    }

    throw new NotAllowedError('Invalid suggestion index provided');
  }

  /**
   * Clear all suggestions for a hangout.
   * @param _id - ObjectId of the hangout.
   * @returns A message indicating the status of the suggestion clearance.
   */
  async clearSuggestions(_id: ObjectId, caller: ObjectId) {
    const hangout = await this.hangouts.readOne({ _id });

    if (!hangout) {
      throw new NotFoundError('This hangout does not exist');
    }

    // Ensure only the author can edit the hangout
    if (caller.toHexString() !== hangout.author.toHexString()) {
      throw new NotAllowedError(`You are not authorized to clear the suggestion
       You are ${caller} and not ${hangout.author}`);
  }

    hangout.suggestion = [];
    await this.hangouts.updateOne({ _id }, hangout);

    return { msg: "All suggestions cleared successfully" };
  }


   /**
   * Validates the HangoutDoc input values.
   * @param hangoutDoc - Hangout document from MongoDB.
   * @param isCreatingNew - A boolean flag indicating if this validation is for creating a new hangout or updating an existing one.
   * @returns An object containing validation results. If valid, isValid is true.
   */
  private validateInputs(hangoutDoc: Partial<HangoutDoc>, isCreatingNew: boolean){
    const { activity, location, date } = hangoutDoc;
    
    if (isCreatingNew) {
      // When creating a new hangout, all fields should be present
      if (!activity || !activity.trim() || !location || !location.trim() || !date) {
        return { isValid: false, message: "All fields must be provided when creating a new hangout." };
      }
    } else {
      // When updating, only validate fields that are present
      if (activity && !activity.trim()) {
        return { isValid: false, message: "Activity must not be empty." };
      }

      if (location && !location.trim()) {
        return { isValid: false, message: "Location must not be empty." };
      }
    }

    // Validate date format as mm/dd/yyyy, but only if a date is provided
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d\d$/;
    if (date && !dateRegex.test(date)) {
      return { isValid: false, message: "Date must be in the format mm/dd/yyyy." };
    }

    return { isValid: true, message: "Inputs are valid." };
  }

}
