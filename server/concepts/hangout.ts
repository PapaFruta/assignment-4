import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";


export interface HangoutDoc extends BaseDoc {
  author: ObjectId;
  date: string;
  activity: string;
  location: string;
  acceptee: Array<ObjectId>;
  suggestion: Array<[ObjectId,Partial<HangoutDoc>]>
}

export default class HangoutConcept{

  public readonly hangouts = new DocCollection<HangoutDoc>("hangouts");
    
  async createHangout(author: ObjectId, date: string, activity: string, location: string){
    const _id = await this.hangouts.createOne({author:author, date:date, activity:activity, location:location, acceptee: [], suggestion: []})

    return {msg: "Hangout proposed", chat: await this.hangouts.readOne({_id})}
  }

  async getHangout(user: ObjectId){
    const hang = await this.hangouts.readMany({$or: [ 
      { author: user }, // either the author is user
      { acceptee: { $elemMatch: { $eq: user } } } // or acceptee has user
    ]})
    return {hangout: hang}
  }

  async deleteHangout(_id:ObjectId){
    await this.hangouts.deleteOne({_id})
    return {msg: "Hangout deleted successfully"}
  }

  async acceptHangout(_id:ObjectId, acceptee: ObjectId){
    const hangout = await this.hangouts.readOne({_id})

    if(hangout){
      if(acceptee == hangout.author){
        return new NotAllowedError('Find a friend');
      }

      hangout.acceptee.push(acceptee);
      await this.hangouts.updateOne({_id},hangout)
      return {msg:"You have accepted hangout"}
    }

    throw new Error('this hangout does not exist')
  }
  
  async getAuthor(_id:ObjectId){
    return (await this.hangouts.readOne({_id}))?.author;
  }

  async suggestEdit(_id:ObjectId, suggestor: ObjectId, update: Partial<HangoutDoc>){
    const hangout = await this.hangouts.readOne({_id})

    if(hangout){
      if(suggestor == hangout.author){
        await this.hangouts.updateOne({_id},update)
        return {msg: "Edit made successfully"};
      }

      hangout.suggestion.push([suggestor,update]);
      await this.hangouts.updateOne({_id},hangout)
      return {msg:"Your suggestion had been recorded", hangout: await this.hangouts.readOne({_id})}
    }
  }

}
