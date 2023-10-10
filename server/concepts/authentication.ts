import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

// Define the structure for the Authentication document in MongoDB
export interface AuthenticationDoc extends BaseDoc {
    user: ObjectId;
    verified: Boolean;
}

export default class AuthenticationConcept {
    // Declare and initialize a new collection for authentication documents in MongoDB
    public readonly authentication = new DocCollection<AuthenticationDoc>("auths");

    /**
     * Create a new authentication entry for a user with a default 'verified' status set to false.
     * @param user - ObjectId of the user.
     * @returns A message indicating success and the created authentication entry.
     */
    async create(user: ObjectId) {
        const _id = await this.authentication.createOne({ user, verified: false });
        return { msg: "User successfully created!", authentication: await this.authentication.readOne({ _id }) };
    }

    /**
     * Verify a user given a valid ID. This checks whether the ID is valid and if so, updates the user's verification status.
     * @param user - ObjectId of the user.
     * @param valid_id - ID to verify against.
     * @returns A message indicating the verification status.
     */
    async verify(user: ObjectId, valid_id: String) {
        // Fetch the user's authentication data
        const userData = await this.authentication.readOne({ user });

        // Handle case where user data is not found
        if (!userData) {
            throw new NotFoundError("User not found!");
        }

        // Check for permission to update the authentication status
        if (userData.user !== user) {
            throw new NotAllowedError('Not allowed to update others authentication status');
        }

        // Handle case where user is already verified
        if (userData.verified) {
            return { msg: "User is already verified!" };
        }

        // Validate the provided ID against some criteria (in this case, a stubbed function)
        if (!this.isGovernmentID(valid_id)) {
            return { msg: "Please provide a valid government ID" };
        }

        // Update the user's verification status to true
        await this.authentication.updateOne({ user }, { verified: true });
        return { msg: "User successfully verified!" };
    }

    /**
     * Check a user's verification status.
     * @param user - ObjectId of the user.
     * @returns The user's verification status.
     */
    async isVerified(user: ObjectId) {
        const userData = await this.authentication.readOne({ user });

        // Handle case where user data is not found
        if (!userData) {
            throw new NotFoundError("User not found!");
        }

        return { msg: `User's Verification status`, isVerified: userData.verified };
    }

    /**
     * Placeholder function to check if the provided ID is a valid government ID.
     * @param id - The ID to be checked.
     * @returns A boolean indicating the validity of the ID.
     */
    public isGovernmentID(id: String): boolean {
        // TODO: Implement actual government ID check
        return true;
    }
}
