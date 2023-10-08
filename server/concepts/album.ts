import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface AlbumDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId
  title: string
  photos: Array<string>
}

export default class AlbumConcept{
  /**
   * Creates an Album between two user
   * 
   */
    public readonly albums = new DocCollection<AlbumDoc>("albums");

    async createAlbum(from: ObjectId, to: ObjectId, title: string){
        const _id = await this.albums.createOne({ from,to,title,photos: [] });
        return { msg: "Album successfully created!", album: await this.albums.readOne({ _id }) };
    }

    async editAlbumTitle(_id:ObjectId, title:string){
      await this.albums.updateOne({_id}, {title:title})
      return { msg: "Album successfully updated!" };
    }

    async addPhoto(_id: ObjectId, photo: string){
      const album = await this.albums.readOne({_id})
      if(album){
        album.photos.push(photo)
      }
      throw new Error('this album does not exist')
    }

    async editAlbum(_id: ObjectId, update: Partial<AlbumDoc>){
        this.sanitizeUpdate(update);

        await this.albums.updateOne({ _id }, update);
        return { msg: "Album successfully updated!", album: await this.albums.readOne({_id}) };
    }

    async getAlbums(to: ObjectId) {
        const album = await this.albums.readMany({$or:[{to:to},{from:to}]});
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


}



  