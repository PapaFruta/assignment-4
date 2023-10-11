import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestNotFoundError } from './errors';

// Document structure for friendships that have an expiration duration.
export interface ExpireFriendshipDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
  createdOn: number;  // Timestamp marking the beginning of the friendship.
  duration: number;   // Duration (in milliseconds) after which the friendship will expire.
}

// Document structure for friend requests that can also expire.
export interface ExpireFriendRequestDoc extends BaseDoc {
  from: ObjectId;  // User who initiates the request.
  to: ObjectId;    // Recipient of the friend request.
  status: "pending" | "rejected" | "accepted";  // The current status of the friend request.
  duration: number;  // Duration (in milliseconds) after which the request will expire if not addressed.
}

// Class for managing friendships and friend requests that can expire.
export default class ExpireFriendConcept {
  public readonly friends = new DocCollection<ExpireFriendshipDoc>("expire-friends");
  public readonly requests = new DocCollection<ExpireFriendRequestDoc>("expire-friendRequests");

  /**
   * Retrieve all friend requests related to a user, whether they are the sender or the recipient.
   * @param user - ObjectId representing the user.
   * @returns An array of friend requests related to the user.
   */
  async getRequests(user: ObjectId){
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }
    
  /**
   * Send a friend request with a specified duration for expiration.
   * @param from - ObjectId of the user sending the request.
   * @param to - ObjectId of the user to whom the request is being sent.
   * @param duration - The duration (in milliseconds) after which the request will expire.
   * @returns A response object with a message and details of the sent request.
   */
  async sendRequest(from: ObjectId, to: ObjectId, duration: number) {
    await this.canSendRequest(from, to);
    const request = await this.requests.createOne({ from, to, status: "pending", duration: duration });
    return { msg: "Sent request!", request: request};
  }

  /**
   * Accept a pending friend request, leading to the formation of an expiring friendship.
   * @param from - ObjectId of the user who sent the request.
   * @param to - ObjectId of the user accepting the request.
   * @returns A response object with a message and details of the accepted request and created friendship.
   */
  async acceptRequest(from: ObjectId, to: ObjectId) {
    const removedRequest = await this.removePendingRequest(from, to);
    const duration =  removedRequest.duration;
    await this.requests.createOne({ from, to, status: "accepted", duration});
    const friend = await this.addFriend(from, to, Date.now(), duration);

    return { msg: "Accepted request!", friend };
  }

  /**
   * Reject a pending friend request.
   * @param from - ObjectId of the user who sent the request.
   * @param to - ObjectId of the user rejecting the request.
   * @returns A response object with a message indicating the request was rejected.
   */
  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    await this.requests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  /**
   * Completely remove a friend request.
   * @param from - ObjectId of the sender of the request.
   * @param to - ObjectId of the recipient of the request.
   * @returns A response object with a message indicating the request was removed.
   */
  async removeRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    return { msg: "Removed request!" };
  }

  /**
   * Terminate an existing friendship.
   * @param user - ObjectId of one user in the friendship.
   * @param friend - ObjectId of the other user in the friendship.
   * @returns A response object with a message indicating the friendship was terminated.
   */
  async removeFriend(user: ObjectId, friend: ObjectId) {
    const friendship = await this.friends.popOne({
      $or: [
        { user1: user, user2: friend },
        { user1: friend, user2: user },
      ],
    });
    if (friendship === null) {
      throw new FriendNotFoundError(user, friend);
    }
    return { msg: "Unfriended!" };
  }

  /**
   * Retrieve all friends of a user.
   * @param user - ObjectId representing the user.
   * @returns An array of ObjectIds representing the user's friends.
   */
  async getFriends(user: ObjectId) {
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return friendships.map((friendship) => (friendship.user1.toString() === user.toString() ? friendship.user2 : friendship.user1));
  }

  /**
   * Terminate friendships that have surpassed their expiration duration.
   * @param user - ObjectId representing the user.
   * @returns A response object with a message indicating expired friendships were removed.
   */
  async removeExpiredFriend(user: ObjectId){
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });

    const currentTime = Date.now();

    for(const friendship of friendships){
      const createdOn = friendship.createdOn;
      const duration = friendship.duration;
      if((createdOn+ duration ) <= currentTime){
        await this.removeFriend(friendship.user1,friendship.user2)
      }
    }
    return {msg: `removed expired friend`} 
  }

  /**
   * Check if two users are friends.
   * @param user - ObjectId of the first user.
   * @param friend - ObjectId of the second user.
   * @returns A boolean indicating whether the two users are friends.
   */
  async isFriend(user: ObjectId, friend: ObjectId){
    const friendship = await this.friends.readOne({
      $or: [
        { user1: user, user2: friend },
        { user1: friend, user2: user },
      ],
    });

    return friendship !== null || user.toString() === friend    .toString();
  }

  // Private helper methods:

  /**
   * Establish a new expiring friendship between two users.
   * @param user1 - ObjectId of the first user.
   * @param user2 - ObjectId of the second user.
   * @param createdOn - The timestamp marking the beginning of the friendship.
   * @param duration - Duration (in milliseconds) after which the friendship will expire.
   * @returns The created friendship document.
   */
  private async addFriend(user1: ObjectId, user2: ObjectId, createdOn: number, duration: number) {
    return { friend: await this.friends.createOne({ user1, user2, createdOn, duration }) };
  }

  /**
   * Remove a pending friend request between two users.
   * @param from - ObjectId of the sender of the request.
   * @param to - ObjectId of the recipient of the request.
   * @returns The removed request document.
   */
  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    const request = await this.requests.popOne({$or:[ {from, to, status: "pending"},{from:to, to:from, status: "pending"}] });
    if (request === null) {
      throw new FriendRequestNotFoundError(from, to);
    }
    return request;
  }

  /**
   * Check if two users aren't friends. Used before initiating a new friend request.
   * @param u1 - ObjectId of the first user.
   * @param u2 - ObjectId of the second user.
   */
  private async isNotFriends(u1: ObjectId, u2: ObjectId) {
    const friendship = await this.friends.readOne({
      $or: [
        { user1: u1, user2: u2 },
        { user1: u2, user2: u1 },
      ],
    });
    if (friendship !== null || u1.toString() === u2.toString()) {
      throw new AlreadyFriendsError(u1, u2);
    }
  }

  /**
   * Validates if a friend request can be initiated between two users.
   * It ensures they aren't already friends and that there isn't a pending request between them.
   * @param u1 - ObjectId of the first user.
   * @param u2 - ObjectId of the second user.
   */
  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.isNotFriends(u1, u2);

    // Check if a pending request already exists between these two users
    const request = await this.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new FriendRequestAlreadyExistsError(u1, u2);
    }
  }
}
