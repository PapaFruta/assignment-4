import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

// UserDoc interface defining the structure of a user document in the database.
export interface UserDoc extends BaseDoc {
  username: string;
  password: string;
  verified: boolean;  // Indicates whether the user is verified or not.
}

export default class UserConcept {
  // Instance of DocCollection for interacting with the 'users' collection in the database.
  public readonly users = new DocCollection<UserDoc>("users");

  // Public Methods

  /**
   * Creates a new user in the database with initial verified status as false.
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {Promise<Object>} A promise that resolves with a success message and the created user document.
   */
  async create(username: string, password: string) {
    await this.canCreate(username, password);  // Validate username and password.
    const _id = await this.users.createOne({ username, password, verified: false });
    return { msg: "User created successfully!", user: await this.users.readOne({ _id }) };
  }

  /**
   * Authenticates a user with a username and password.
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {Promise<Object>} A promise that resolves with a success message and the user's ID.
   */
  async authenticate(username: string, password: string) {
    const user = await this.users.readOne({ username, password });
    if (!user) {
      throw new NotAllowedError("Username or password is incorrect.");
    }
    return { msg: "Successfully authenticated.", _id: user._id };
  }

  /**
   * Updates a user's information in the database.
   * @param {ObjectId} _id - The ObjectId of the user to update.
   * @param {Partial<UserDoc>} update - The object containing the fields to update.
   * @returns {Promise<Object>} A promise that resolves with a success message.
   */
  async update(_id: ObjectId, update: Partial<UserDoc>) {
    if (update.username !== undefined) {
      await this.isUsernameUnique(update.username);  // Check if the new username is unique.
    }
    await this.users.updateOne({ _id }, update);
    return { msg: "User updated successfully!" };
  }

  /**
   * Deletes a user from the database.
   * @param {ObjectId} _id - The ObjectId of the user to delete.
   * @returns {Promise<Object>} A promise that resolves with a success message.
   */
  async delete(_id: ObjectId) {
    await this.users.deleteOne({ _id });
    return { msg: "User deleted!" };
  }

  /**
   * Checks if a user exists in the database by their ObjectId.
   * @param {ObjectId} _id - The ObjectId of the user to check.
   */
  async userExists(_id: ObjectId) {
    const maybeUser = await this.users.readOne({ _id });
    if (maybeUser === null) {
      throw new NotFoundError(`User not found!`);
    }
  }

  // Private Methods

  /**
   * Validates the username and password, and checks if the username is unique.
   * @param {string} username - The username to validate.
   * @param {string} password - The password to validate.
   */
  private async canCreate(username: string, password: string) {
    if (!username || !password) {
      throw new BadValuesError("Username and password must be non-empty!");
    }
    await this.isUsernameUnique(username);  // Ensure the username is unique.
  }

  /**
   * Checks if a username is unique in the database.
   * @param {string} username - The username to check.
   */
  private async isUsernameUnique(username: string) {
    if (await this.users.readOne({ username })) {
      throw new NotAllowedError(`User with username ${username} already exists!`);
    }
  }

   /**
   * Retrieves a sanitized user (without password) by their ObjectId.
   * @param {ObjectId} _id - The ObjectId of the user to retrieve.
   * @returns {Promise<Object>} A promise that resolves with the sanitized user document.
   */
   async getUserById(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (user === null) {
      throw new NotFoundError(`User not found!`);
    }
    return this.sanitizeUser(user);  // Return user data without the password.
  }

  /**
   * Retrieves a sanitized user (without password) by their username.
   * @param {string} username - The username of the user to retrieve.
   * @returns {Promise<Object>} A promise that resolves with the sanitized user document.
   */
  async getUserByUsername(username: string) {
    const user = await this.users.readOne({ username });
    if (user === null) {
      throw new NotFoundError(`User not found!`);
    }
    return this.sanitizeUser(user);  // Return user data without the password.
  }

  /**
   * Maps an array of user ObjectIds to their corresponding usernames.
   * If a user is not found, it is mapped to "DELETED_USER".
   * @param {ObjectId[]} ids - An array of user ObjectIds.
   * @returns {Promise<string[]>} A promise that resolves with an array of usernames.
   */
  async idsToUsernames(ids: ObjectId[]) {
    const users = await this.users.readMany({ _id: { $in: ids } });
    const idToUser = new Map(users.map((user) => [user._id.toString(), user]));
    return ids.map((id) => idToUser.get(id.toString())?.username ?? "DELETED_USER");
  }

  /**
   * Retrieves a list of all users or users with a specific username, sanitized (without passwords).
   * @param {string} [username] - An optional username to filter the users.
   * @returns {Promise<Object[]>} A promise that resolves with an array of sanitized user documents.
   */
  async getUsers(username?: string) {
    const filter = username ? { username } : {};  // Create a filter if a username is specified.
    const users = (await this.users.readMany(filter)).map(this.sanitizeUser);
    return users;
  }

  // Private Method

  /**
   * Sanitizes the user document by removing the password field.
   * @param {UserDoc} user - The user document to sanitize.
   * @returns {Object} The sanitized user document.
   */
  private sanitizeUser(user: UserDoc) {
    const { password, ...rest } = user; // Remove the password field.
    return rest;
  }

  /**
     * Verify a user given a valid ID. This checks whether the ID is valid and if so, updates the user's verification status.
     * @param user - ObjectId of the user.
     * @param valid_id - ID to verify against.
     * @returns A message indicating the verification status.
     */
  async verify(user: ObjectId, valid_id: String) {
    // Fetch the user's authentication data
    const userData = await this.users.readOne({ _id:user });

    // Handle case where user data is not found
    if (!userData) {
        throw new NotFoundError("User not found!");
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
    await this.users.updateOne({  _id:user }, { verified: true });
    return { msg: "User successfully verified!" };
}

  /**
     * Check a user's verification status.
     * @param user - ObjectId of the user.
     * @returns The user's verification status.
     */
  async isVerified(user: ObjectId) {
    const userData = await this.users.readOne({ _id:user });

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
