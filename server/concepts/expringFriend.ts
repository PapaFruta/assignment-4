import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestNotFoundError } from './friend';

export interface ExpireFriendshipDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
  createdOn: number;
  duration: number;
}

export interface ExpireFriendRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";

  duration: number
}

export default class ExpireFriendConcept {
  public readonly friends = new DocCollection<ExpireFriendshipDoc>("expire-friends");
  public readonly requests = new DocCollection<ExpireFriendRequestDoc>("expire-friendRequests");

  async getRequests(user:ObjectId){
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }
    
  async sendRequest(from: ObjectId, to: ObjectId, duration: number) {
    await this.canSendRequest(from, to);
    //Send a request with duration
    await this.requests.createOne({ from, to, status: "pending", duration: duration });
    return { msg: "Sent request!" };
  }

  async acceptRequest(from: ObjectId, to: ObjectId) {
    const removedRequest = await this.removePendingRequest(from, to);
    const duration =  removedRequest.duration
    // Following two can be done in parallel, thus we use `void`
    void this.requests.createOne({ from, to, status: "accepted", duration});
    void this.addFriend(from, to, Date.now(), duration);
    return { msg: "Accepted request!" };
  }

  async rejectRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    await this.requests.createOne({ from, to, status: "rejected" });
    return { msg: "Rejected request!" };
  }

  async removeRequest(from: ObjectId, to: ObjectId) {
    await this.removePendingRequest(from, to);
    return { msg: "Removed request!" };
  }

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

  async getFriends(user: ObjectId) {
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    // Making sure to compare ObjectId using toString()
    return friendships.map((friendship) => (friendship.user1.toString() === user.toString() ? friendship.user2 : friendship.user1));
  }

  //remove all expired friend
  async removeExpiredFriend(user: ObjectId){
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });

    const currentTime = Date.now();

    //check for expired friendship
    for(const friendship of friendships){
      
      const createdOn = friendship.createdOn 
      const duration = friendship.duration
      //if the friendship is expired, remove the friendship connection
      if((createdOn+ duration ) >= currentTime){
        console.log('here')
        await this.removeFriend(friendship.user1,friendship.user2)
      }

    }
    return {msg: `removed expired friend`} 
  }

  private async addFriend(user1: ObjectId, user2: ObjectId, createdOn: number, duration: number) {
    void this.friends.createOne({ user1, user2, createdOn, duration});
  }

  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    const request = await this.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new FriendRequestNotFoundError(from, to);
    }
    return request;
  }

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


  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.isNotFriends(u1, u2);
    // check if there is pending request between these users
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