import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface ChatDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId
  message: [[ObjectId,string]]
}

export default class ChatConcept{
    public readonly chats = new DocCollection<ChatDoc>("chats");

    //in router check if they are friend
    async startChat(user1: ObjectId, user2: ObjectId, message: string){
        this.checkDuplicate(user1,user2);
        
        const _id = await this.chats.createOne({user1:user1,user2:user2,message:[[user1,message]]});
        return {msg: "Chat started", chat: await this.chats.readOne({_id})}
    }

    async sendMessage(user1:ObjectId, user2: ObjectId, message: string){
        const chat = await this.chats.readOne({$or:[{user1:user1,user2:user2},{user1:user2,user2:user1}]})

        if (chat){
            chat.message.push([user1,message]);
            await this.chats.updateOne({$or:[{user1:user1,user2:user2},{user1:user2,user2:user1}]},chat)
            return {msg: "message sent"}
        }else{
            throw new Error('This chat does not exist')
        }

    }

    async getChat(user1: ObjectId, user2: ObjectId){
        const chat = await this.chats.readOne({$or:[{user1:user1,user2:user2},{user1:user2,user2:user1}]})

        if(chat){
            return chat
        }

        throw new Error('This chat does not exist, please start one');

    }

    async checkDuplicate(user1: ObjectId, user2: ObjectId){
        const chat = await this.chats.readOne({$or: [{user1,user2},{user2,user1}]})

        if(chat){
            throw new Error('There is already an ongoing chat.')
        }
    }

}