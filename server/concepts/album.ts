import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface AlbumDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId
  title: string
  photos: string
}

export default class AlbumConcept{
    public readonly albums = new DocCollection<AlbumDoc>("albums");

    async createAlbum(from: ObjectId, to: ObjectId, title: string, photos: string){
        const _id = await this.albums.createOne({ from,to,title,photos });
        return { msg: "Album successfully created!", album: await this.albums.readOne({ _id }) };
    }

    async editAlbum(_id: ObjectId, update: Partial<AlbumDoc>){
        this.sanitizeUpdate(update);
        await this.albums.updateOne({ _id }, update);
        return { msg: "Album successfully updated!" };
    }

    async getAlbums(to: ObjectId) {
        const album = await this.albums.readMany({to});
        return album;
    }

    async deleteAlbums(_id: ObjectId){
        await this.albums.deleteOne({ _id });
        return { msg: "Album deleted successfully!" };
    }

    private sanitizeUpdate(update: Partial<AlbumDoc>) {
        // Make sure the update cannot change the author.
        const allowedUpdates = ["title", "photos"];
        for (const key in update) {
          if (!allowedUpdates.includes(key)) {
            throw new NotAllowedError(`Cannot update '${key}' field!`);
          }
        }
      }

    async editPermission(user: ObjectId, _id: ObjectId){
        const album = await this.albums.readMany({ _id });
        if (!album) {
            throw new NotFoundError(`album ${_id} does not exist!`);
        }
        console.log('this is albums: ',album)
        // if (album.from.toString() !== user.toString() && album.to.toString() !== user.toString()) {
        // throw new NotAllowedError(user.toString(), _id);
        // }
    }


}



  