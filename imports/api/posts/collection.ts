import { Mongo } from 'meteor/mongo';

export interface Post {
  _id: string;
  title: string;
  body: string;
  authorId: string;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PostInput = Pick<Post, 'title' | 'body'>;

export const Posts = new Mongo.Collection<Post>('posts');
