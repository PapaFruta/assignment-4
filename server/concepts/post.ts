import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

// Define the PostOptions interface which provides customizable post settings
export interface PostOptions {
  backgroundColor?: string;
}

// Define the primary structure for posts in the database
export interface PostDoc extends BaseDoc {
  author: ObjectId;
  photos: Array<string>;
  caption?: string;
}

// The main class to manage posts and their related functionalities
export default class PostConcept {
  public readonly posts = new DocCollection<PostDoc>("posts");

  /**
   * Create a new post.
   * @param author - The ObjectId of the author.
   * @param photos - The photos' URL.
   * @param caption - Optional caption for the post.
   * @returns Confirmation message with the created post data.
   */
  async create(author: ObjectId, photos: Array<string>, caption?: string) {
    const _id = await this.posts.createOne({ author, photos, caption });
    return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  /**
   * Retrieve multiple posts based on the given query.
   * @param query - The filter criteria to apply on post retrieval.
   * @returns Array of matching posts.
   */
  async getPosts(query: Filter<PostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  /**
   * Retrieve posts authored by a specific user.
   * @param author - The ObjectId of the author.
   * @returns Array of posts authored by the given user.
   */
  async getByAuthor(author: ObjectId) {
    return await this.getPosts({ author });
  }

  /**
   * Delete a post.
   * @param _id - The ObjectId of the post.
   * @returns Confirmation message of the deletion.
   */
  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }

  /**
   * Check if the specified user is the author of the given post.
   * @param user - The ObjectId of the user.
   * @param _id - The ObjectId of the post.
   */
  async isAuthor(user: ObjectId, _id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }
}

// Custom error class to handle unauthorized post edits
export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
