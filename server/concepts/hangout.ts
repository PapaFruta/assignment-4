import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";

export interface HangoutDoc extends BaseDoc {
  author: ObjectId;
  date: number;
  activity: string;
  location: string;
  acceptee: Array<ObjectId>;
  suggestion: Array<Partial<HangoutDoc>>
}

export default class HangoutConcept{
    
}
