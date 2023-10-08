import AlbumConcept from "./concepts/album";
import AuthenticationConcept from "./concepts/authentication";
import ChatConcept from "./concepts/chat";
import ExpireFriendConcept from "./concepts/expringFriend";
import FriendConcept from "./concepts/friend";
import HangoutConcept from "./concepts/hangout";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();
export const ExpireFriend = new ExpireFriendConcept();
export const Authentication = new AuthenticationConcept();
export const Profile = new ProfileConcept();
export const Album = new AlbumConcept();
export const Chat = new ChatConcept();
export const Hangout = new HangoutConcept();