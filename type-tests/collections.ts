import { Posts, type PostInput } from '../imports/api/posts/collection';
import { Comments } from '../imports/api/comments/collection';

async function collectionContracts(postId: string, commentId: string) {
  const post = await Posts.findOneAsync(postId);
  if (post) {
    const input: PostInput = { title: post.title, body: post.body };
    input.title.toUpperCase();
    post.createdAt.getTime();
    // @ts-expect-error Post visibility must stay boolean.
    await Posts.updateAsync(postId, { $set: { hidden: 'yes' } });
  }
  const comment = await Comments.findOneAsync(commentId);
  if (comment) {
    comment.text.toUpperCase();
    // @ts-expect-error Comment timestamps must stay Date objects.
    comment.createdAt = 'yesterday';
  }
}

void collectionContracts;
