import AlbumConcept from "./concepts/album";
import ChatConcept from "./concepts/chat";
import ExpireFriendConcept from "./concepts/expiringFriend";
import HangoutConcept from "./concepts/hangout";
import PostConcept from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import TagConcept from "./concepts/tag";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const ExpireFriend = new ExpireFriendConcept();
export const Profile = new ProfileConcept();
export const Album = new AlbumConcept();
export const Chat = new ChatConcept();
export const Hangout = new HangoutConcept();
export const Tag = new TagConcept();
