import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface ProfileDoc extends BaseDoc {
    user: ObjectId;
    profilePic: String;
    first: String;
    last: String;
}

export default class ProfileConcept{
    public readonly profile = new DocCollection<ProfileDoc>("profile");

    async create(user: ObjectId, profilePic: String, firstname : String, lastname: String) {
        this.doesProfileExist(user);
        const _id = await this.profile.createOne({ user, profilePic: profilePic, first: firstname, last:lastname });
        return { msg: "User successfully created!", Profile: await this.profile.readOne({ _id }) };
    }

    async get(user:ObjectId){
        return await this.profile.readOne({user})
    }

    async update(user: ObjectId, update:  Partial<ProfileDoc>){
        await this.profile.updateOne({ user }, update);
        return { msg: "User updated successfully!" };
    }

    private async doesProfileExist(user: ObjectId) {
        if (await this.profile.readOne({ user })) {
          throw new NotAllowedError(`User's profile already exists!`);
        }
      }
}