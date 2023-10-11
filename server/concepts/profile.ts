import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

// Define the structure for user profiles in the database
export interface ProfileDoc extends BaseDoc {
    user: ObjectId;          // Identifier for the user
    profilePic: String;      // URL or path to the user's profile picture
    firstname: String;           // User's first name
    lastname: String;            // User's last name
}

// The main class to manage user profiles and their related functionalities
export default class ProfileConcept{
    public readonly profile = new DocCollection<ProfileDoc>("profile");

    /**
     * Create a new user profile.
     * @param user - The ObjectId of the user.
     * @param profilePic - The URL/path to the user's profile picture.
     * @param firstname - The user's first name.
     * @param lastname - The user's last name.
     * @returns Confirmation message with the created profile data.
     */
    async create(user: ObjectId, profilePic: String, firstname : String, lastname: String) {
        this.doesProfileExist(user); // Ensure profile doesn't already exist
        const _id = await this.profile.createOne({ user, profilePic: profilePic, firstname: firstname, lastname: lastname });
        return { msg: "User successfully created!", Profile: await this.profile.readOne({ _id }) };
    }

    /**
     * Retrieve a user's profile.
     * @param user - The ObjectId of the user.
     * @returns The profile data of the specified user.
     */
    async get(user:ObjectId){
        return await this.profile.readOne({user});
    }

    /**
     * Update specific fields of a user's profile.
     * @param user - The ObjectId of the user.
     * @param update - Object containing fields to update.
     * @returns Confirmation message of the update.
     */
    async update(user: ObjectId, update:  Partial<ProfileDoc>){
        await this.profile.updateOne({ user }, update);
        return { msg: "User updated successfully!" };
    }

    // Private helper methods

    /**
     * Check if a user's profile already exists.
     * @param user - The ObjectId of the user.
     * @throws {NotAllowedError} - If the profile already exists.
     */
    private async doesProfileExist(user: ObjectId) {
        if (await this.profile.readOne({ user })) {
            throw new NotAllowedError(`User's profile already exists!`);
        }
    }
}
