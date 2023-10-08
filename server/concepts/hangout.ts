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
    return {hangout: await this.hangouts.readMany({user})}
  }

  async deleteHangout(id:ObjectId){
    await this.hangouts.deleteOne({id})
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

  async suggestEdit(id:ObjectId, suggestor: ObjectId, update: Partial<HangoutDoc>){
    const hangout = await this.hangouts.readOne({id})

    if(hangout){
      if(suggestor == hangout.author){
        await this.hangouts.updateOne({id},update)
        return {msg: "Edit made successfully"};
      }

      hangout.suggestion.push([suggestor,update]);
      await this.hangouts.updateOne({id},hangout)
      return {msg:"Your suggestion had been recorded"}
    }
  }

}
