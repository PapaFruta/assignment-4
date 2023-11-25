import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface TagDoc extends BaseDoc{
    name: String;
    item: Array<ObjectId>;
}

export default class TagConcept{
    public readonly tags = new DocCollection<TagDoc>("tags");

    async create(i: ObjectId, n: string){
        if (n.length > 20) {
            throw new NotAllowedError("Tag is too long. Maximum length is 20 characters.");
        }
    
        // Character Set Restriction
        if (!/^[a-zA-Z0-9-_]+$/.test(n)) {
            throw new NotAllowedError("Tag contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.");
        }

        const exist = await this.tags.readOne({name: n});

        if(exist){
            const attachResponse = await this.attach(i,exist._id);
            return {msg: "Tag already exist", tag: attachResponse.tag}
        }
        else{
            const createdTag = await this.tags.createOne({name: n, item: [i]});
            return {msg: "Tag successfully created", tag: createdTag};
        }   
    }

    async attach(i: ObjectId, t: ObjectId){
        const tag = await this.tags.readOne({_id:t})

        if (!tag) {
            throw new NotFoundError("This tag does not exist");
        }
    
        // Check if the item is already attached to the tag
        if (!tag.item.includes(i)) {
            // Attach the item to the tag
            tag.item.push(i);
    
            // Save the updated tag
            const updatedTag = await this.tags.updateOne({_id: t}, {item: tag.item});
    
            return {msg: "Item successfully attached to tag", tag:updatedTag};
        } else {
            return {msg: "Item is already attached to this tag", tag:tag};
        }
    }

    async getTagByName(n: string) {
        const tag = await this.tags.readOne({name: n});
        if (!tag) {
            throw new NotFoundError("Tag not found");
        }
        return tag;
    }

    async getTagById(id: ObjectId) {
        const tag = await this.tags.readOne({_id: id});
        if (!tag) {
            throw new NotFoundError("Tag not found");
        }
        return tag;
    }

    /**
     * 
     * Find all tag attach to itemId
     * 
     * @param itemId ObjectID of the item 
     * @returns list of Tag objects
     */
    async getTagsByItemId(itemId: ObjectId) {
        const tags = await this.tags.readMany({ 'item': { $elemMatch: { $eq: itemId } } });
        return tags;
    }

}