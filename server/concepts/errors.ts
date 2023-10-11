import { ObjectId } from "mongodb";
import { FormattableError } from "../framework/router";

/**
 * Corresponds to an action attempted by a user that contains bad values for parameters.
 * If this action was a HTTP request, status code for this error would be 400 Bad Request.
 */
export class BadValuesError extends FormattableError {
  public readonly HTTP_CODE = 400;
}

/**
 * Corresponds to an action attempted by a user that is not authenticated.
 * If this action was a HTTP request, status code for this error would be 401 Unauthorized.
 */
export class UnauthenticatedError extends FormattableError {
  public readonly HTTP_CODE = 401;
}

/**
 * Corresponds to a forbidden action attempted by a user.
 * If this action was a HTTP request, status code for this error would be 403 Forbidden.
 */
export class NotAllowedError extends FormattableError {
  public readonly HTTP_CODE = 403;
}

/**
 * Corresponds to an action that attempts to access a resource that doesn't exist.
 * If this action was a HTTP request, status code for this error would be 404 Not Found.
 */
export class NotFoundError extends FormattableError {
  public readonly HTTP_CODE = 404;
}


/**
 * Corresponds to an action that attempts to duplicate a resource that cannot be dup
 * If this action was a HTTP request, status code for this error would be 404 Not Found.
 */
export class DuplicateError extends FormattableError {
  public readonly HTTP_CODE = 405;
}


export class FriendRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request from {0} to {1} does not exist!", from, to);
  }
}

export class FriendRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request between {0} and {1} already exists!", from, to);
  }
}

export class FriendNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Friendship between {0} and {1} does not exist!", user1, user2);
  }
}

export class AlreadyFriendsError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("{0} and {1} are already friends!", user1, user2);
  }
}
