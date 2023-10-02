import { ObjectId } from "mongodb";

import { Authentication, ExpireFriend, Post, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
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

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    const user = await User.create(username, password);
    const id = await User.getUserByUsername(username);
    await Authentication.create(id._id);

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

  //sync with remove expired friend so expired friendship are remove when log in
  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);

    await ExpireFriend.removeExpiredFriend(u._id);

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
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
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

  @Router.get("/f")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await ExpireFriend.getFriends(user));
  }

  @Router.delete("/f/remove/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await ExpireFriend.removeFriend(user, friendId);
  }

  @Router.delete("/f/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await ExpireFriend.removeRequest(user, toId);
  }

  @Router.put("/f/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await ExpireFriend.acceptRequest(fromId, user);
  }

  @Router.put("/f/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await ExpireFriend.rejectRequest(fromId, user);
  }

  @Router.post("/f/request/:to/:duration")
  async sendExpireFriendRequest(session: WebSessionDoc, to: string, duration: number){
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await ExpireFriend.sendRequest(user, toId, duration);
  }

  @Router.get("/f/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.expringFriendRequests(await ExpireFriend.getRequests(user));
  }

  @Router.delete("/f/RemoveExpire")
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
  async vertify(session:WebSessionDoc, id: String){
    const user = WebSession.getUser(session);
    return await Authentication.vertify(user,id);
  }
}

export default getExpressRouter(new Routes());
;