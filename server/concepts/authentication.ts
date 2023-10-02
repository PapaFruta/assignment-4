import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface AuthenticationDoc extends BaseDoc {
    user: ObjectId;
    vertified: Boolean;
}

export default class AuthenticationConcept{

    public readonly authentication = new DocCollection<AuthenticationDoc>("auths");

    async create(user: ObjectId) {
        const _id = await this.authentication.createOne({ user, vertified: false });
        return { msg: "User successfully created!", authentication: await this.authentication.readOne({ _id }) };
    }

    async vertify(user: ObjectId, valid_id: String){
        /**
         * Given user and a valid id, check if id is valid and update the user's authentication status
         */
        const userData = await this.authentication.readOne({ user });
    
        if (!userData) {
            throw new NotFoundError("User not found!");
        }

        // Check if user is already verified
        if (userData.vertified) {
            return { msg: "User is already verified!" };
        }

        // Check if valid_id is a government ID (basic check for demonstration purposes)
        if (!this.isGovernmentID(valid_id)) {
            throw new NotAllowedError("Provided ID is not valid!");
        }

        // If user exists and valid_id is a government ID, turn verified status to true
        await this.authentication.updateOne({ user }, { vertified: true });
        return { msg: "User successfully verified!" };
    }

    async isVertify(user: ObjectId){
        const userData = await this.authentication.readOne({ user });

        if (!userData) {
            throw new NotFoundError("User not found!");
        }

        return  { msg: `User's Vertification status`, isVertify: userData.vertified };
    }

    public isGovernmentID(id: String){
    //I am not checking gov id, anything user upload is gonna count lol
        return true
    }
}