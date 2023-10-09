import { ObjectId } from "mongodb";

import { Album, Authentication, Chat, ExpireFriend, Hangout, Post, Profile, User, WebSession } from "./app";
import { AlbumDoc } from "./concepts/album";
import { HangoutDoc } from "./concepts/hangout";
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
    const user1 = WebSession.getUser(session);
    const user2 = await User.getUserByUsername(to);

    if(await ExpireFriend.isFriend(user1,user2._id)){
      return await Chat.startChat(user1,user2._id, message);
    }
    throw new Error('You two are not friend')
  } 

  //get all message
  @Router.get("/chat/")
  async getChat(session: WebSessionDoc, to: string){
    const user1 = WebSession.getUser(session);
    const user2 = await User.getUserByUsername(to);
    return await Chat.getChat(user1,user2._id);
  }

  @Router.patch("/chat/")
  async sendMessage(session:WebSessionDoc, to: string, message: string){
    const user1 = WebSession.getUser(session);
    const user2 = await User.getUserByUsername(to);

    return await Chat.sendMessage(user1,user2._id,message)
  }

  //create album
  @Router.post("/chat/album")
  async createAlbum(session:WebSessionDoc,to: string, title: string){
    const user = WebSession.getUser(session);
    const friend = (await User.getUserByUsername(to))._id
    //only allow to create album if they are friend
    if(await ExpireFriend.isFriend(user,friend)){
      const toUser = await User.getUserByUsername(to)
      return await Album.createAlbum(user,toUser._id,title)
    }
    throw Error('The users are not friend')
    
  }

  @Router.patch("/chat/album/:_id")
  async editAlbum(session: WebSessionDoc, _id: ObjectId, update: Partial<AlbumDoc>){
    const user = WebSession.getUser(session);

    return await Album.editAlbum(_id, update);
  }

  @Router.get("/chat/album")
  async getAlbum(session:WebSessionDoc, to: string){
    const author = WebSession.getUser(session);
    const friend =await User.getUserByUsername(to)
    return await Album.getAlbums(( friend)._id);
  }

  @Router.delete("/chat/album/:_id")
  async deleteAlbum(session:WebSessionDoc, _id: ObjectId){
    const author = WebSession.getUser(session);
    // await Album.editPermission(author, _id);

    return await Album.deleteAlbums(_id);
  }

  //hangout proposal
  @Router.post("/hangout")
  async proposeHangout(session:WebSessionDoc, date: string, activity: string, location: string){
    const author = WebSession.getUser(session);

    return await Hangout.createHangout(author, date , activity, location);
  }

  @Router.get("/hangout")
  async getHangout(session:WebSessionDoc, user: ObjectId){
    const author = WebSession.getUser(session);

    return await Hangout.getHangout(user);
  }
  
  @Router.patch("/hangout/:id/accept")
  async acceptHangout(session:WebSessionDoc, id:ObjectId){
    const author = WebSession.getUser(session);

    return await Hangout.acceptHangout(id,author);
  }

  @Router.patch("/hangout/:id/suggest")
  async suggestEdit(session:WebSessionDoc, id:ObjectId, update: Partial<HangoutDoc>){
    const suggestor = WebSession.getUser(session);

    const author = await Hangout.getAuthor(id)

    if (author){
      if(await ExpireFriend.isFriend(author,suggestor)){
        return await Hangout.suggestEdit(id,suggestor,update);
      }
    }
    
    throw new Error("Invalid")
  }

  @Router.delete("/hangout")
  async deleteHangout(session:WebSessionDoc, id: ObjectId){
    const author = WebSession.getUser(session);

    return await Hangout.deleteHangout(id);
  }
}

export default getExpressRouter(new Routes());
