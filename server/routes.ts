import { ObjectId } from "mongodb";

import { Authentication, ExpireFriend, Post, Profile, User, WebSession } from "./app";
import { PostDoc } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import { Router, getExpressRouter } from "./framework/router";
import Responses from "./responses";


class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  /**
   * 
   * sync create user
   * when create user:
   * intialize user's authentication status
   * initialize user's profile
   * 
   */
  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string, profilePic:string, first:string, last:string) {
    WebSession.isLoggedOut(session);
    const user = await User.create(username, password);
    const id = await User.getUserByUsername(username);
    await Authentication.create(id._id);
    await Profile.create(id._id,profilePic,first,last);
    return user
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  /**
   * 
   * Sync login and auto-removing expiring friend
   * 
   * 
   */
  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);

    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, photos: string, caption?: string) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, photos, caption);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friend")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);

    await ExpireFriend.removeExpiredFriend(user);

    return await User.idsToUsernames(await ExpireFriend.getFriends(user));
  }

  @Router.delete("/friend/remove/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await ExpireFriend.removeFriend(user, friendId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await ExpireFriend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await ExpireFriend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await ExpireFriend.rejectRequest(fromId, user);
  }

  @Router.post("/friend/request/")
  async sendExpireFriendRequest(session: WebSessionDoc, to: string, duration: number){
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await ExpireFriend.sendRequest(user, toId, duration);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.expringFriendRequests(await ExpireFriend.getRequests(user));
  }

  @Router.delete("/friend/RemoveExpire")
  async removeExpiredFriend(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await ExpireFriend.removeExpiredFriend(user);
  }

  @Router.get("/isVertify")
  async isVertify(session: WebSessionDoc){
    const user = WebSession.getUser(session);
    return await Authentication.isVertify(user);
  }

  @Router.post("/vertify/:id")
  async vertify(session:WebSessionDoc, id: string){
    const user = WebSession.getUser(session);
    return await Authentication.vertify(user,id);
  }

  @Router.get("/profile")
  async getProfile(session: WebSessionDoc){
    const user = WebSession.getUser(session);
    return await Profile.get(user);
  }

  @Router.patch("/profile/update")
  async updateProfile(session: WebSessionDoc, update: Partial<ProfileDoc>) {
    const user = WebSession.getUser(session);
    return await Profile.update(user, update);
  }

  //send chat message
  @Router.post("/chat/")
  async startChat(session: WebSessionDoc, to: string, message: string){
    throw Error('not implemented');
  }

  //get all message
  @Router.get("/chat/")
  async getChat(session: WebSessionDoc, to: string){
    throw Error('not implemented');
  }

  //create album
  @Router.post("/chat/album/:title")
  async createAlbum(session:WebSessionDoc, title: string, to: string, media: Array<string>){
    throw Error('not implemented');
  }

  // @Router.update("/chat/album/:title")
  // async updateAlbum(session:WebSessionDoc, title: string, to: string, update: Partial<AlbumDoc>){
  //   throw Error('not implemented');
  // }

  @Router.get("/chat/album/:id")
  async getAlbum(session:WebSessionDoc, id: string){
    throw Error('not implemented');
  }

  @Router.delete("/chat/album/:id")
  async deleteAlbum(session:WebSessionDoc, id: string){
    throw Error('not implemented');
  }

  //hangout proposal
  @Router.post("/hangout")
  async proposeHangout(session:WebSessionDoc, activity: string, location: string, time: number){
    throw Error('not implemented');
  }

  @Router.get("/hangout/:id")
  async getHangout(session:WebSessionDoc, id: string){
    throw Error('not implemented');
  }
  
  // @Router.patch("/hangout/:id")
  // async suggestEdit(session:WebSessionDoc, id: string, update: Partial<HangoutDoc>){
  //   throw Error('not implemented');
  // }

  @Router.delete("/hangout/:id")
  async deleteHangout(session:WebSessionDoc, id: string){
    throw Error('not implemented');
  }
}

export default getExpressRouter(new Routes());
;