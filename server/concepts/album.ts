import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { DuplicateError } from "./errors";

export interface AlbumDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId
  title: string
  photos: Array<string>
}

export default class AlbumConcept{
    public readonly albums = new DocCollection<AlbumDoc>("albums");

    async createAlbum(from: ObjectId, to: ObjectId, title: string, photos: Array<string>){
        this.isDuplicate(from,to,title);
        const _id = await this.albums.createOne({ from,to,title,photos });
        return { msg: "Album successfully created!", album: await this.albums.readOne({ _id }) };
    }

    

    async isDuplicate(from: ObjectId, to: ObjectId, title: string){
        const dup = await this.albums.readMany({from,to,title})
        if(dup){
            throw new DuplicateError('You cannot make album with duplicated name in the same chat');
        }
    }
}



  