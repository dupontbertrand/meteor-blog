import { Mongo } from 'meteor/mongo';

export interface Comment {
  _id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

export const Comments = new Mongo.Collection<Comment>('comments');
