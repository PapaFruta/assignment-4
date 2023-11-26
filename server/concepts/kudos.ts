import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface KudoDoc extends BaseDoc{
    giver: ObjectId;
    receiver: ObjectId;
    task: ObjectId;
    message: String;
}

export default class KudoConcept{

    public readonly kudos = new DocCollection<KudoDoc>("kudos");

    async giveKudos(giver: ObjectId, receiver: ObjectId, task: ObjectId, message: string){
        const found = await this.kudos.readMany({giver: giver, task: task});

        if(found.length > 0){
            return {'msg': "You have already given a kudos"};
        }
        
        const created = await this.kudos.createOne({giver:giver, receiver:receiver, task:task, message:message})

        return {msg: "Successfully Sent Kudos", kudo: created}
    }

    async getKudoForTask(task: ObjectId){
        const found = await this.kudos.readOne({task:task})
        return found
    }

    async getReceivedKudosOfUser(user: ObjectId): Promise<KudoDoc[]> {
        const receivedKudos = await this.kudos.readMany({ receiver: user });
        return receivedKudos;
    }

    async getGivenKudosOfUser(user: ObjectId): Promise<KudoDoc[]> {
        const givenKudos = await this.kudos.readMany({ giver: user });
        return givenKudos;
    }

    async getReceivedKudosCount(user: ObjectId): Promise<number> {
        const receivedKudos = await this.kudos.readMany({ receiver: user });
        return receivedKudos.length;
    }

    async getGivenKudosCount(user: ObjectId): Promise<number> {
        const givenKudos = await this.kudos.readMany({ giver: user });
        return givenKudos.length;
    }
}