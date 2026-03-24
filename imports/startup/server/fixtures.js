import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/roles';
import { Posts } from '../../api/posts/collection';
import { Comments } from '../../api/comments/collection';

const ROLES = ['admin', 'moderator', 'editor', 'viewer'];

const PERMISSIONS = {
  viewer: ['comments.create'],
  editor: ['posts.create', 'posts.edit.own', 'comments.create'],
  moderator: ['posts.hide', 'comments.delete', 'posts.create', 'posts.edit.own', 'comments.create'],
  admin: [
    'posts.create', 'posts.edit.own', 'posts.edit.all', 'posts.delete', 'posts.hide',
    'comments.create', 'comments.delete', 'users.manage',
  ],
};

const TEST_USERS = [
  { email: 'admin@test.com', role: 'admin' },
  { email: 'moderator@test.com', role: 'moderator' },
  { email: 'editor@test.com', role: 'editor' },
  { email: 'viewer@test.com', role: 'viewer' },
];

async function seedRoles() {
  for (const role of [...ROLES, ...Object.values(PERMISSIONS).flat()]) {
    await Roles.createRoleAsync(role, { unlessExists: true });
  }
  // Hierarchy: admin > moderator > editor > viewer
  await Roles.addRolesToParentAsync('viewer', 'editor');
  await Roles.addRolesToParentAsync('editor', 'moderator');
  await Roles.addRolesToParentAsync('moderator', 'admin');

  // Assign permissions to roles
  for (const [role, perms] of Object.entries(PERMISSIONS)) {
    for (const perm of perms) {
      await Roles.addRolesToParentAsync(perm, role);
    }
  }
}

async function seedUsers() {
  const userIds = {};
  for (const { email, role } of TEST_USERS) {
    let user = await Accounts.findUserByEmail(email);
    if (!user) {
      const userId = await Accounts.createUserAsync({ email, password: 'password' });
      await Roles.setUserRolesAsync(userId, [role]);
      userIds[role] = userId;
    } else {
      userIds[role] = user._id;
    }
  }
  return userIds;
}

const SEED_POSTS = [
  {
    title: 'Getting Started with Meteor 3',
    body: `Meteor 3 represents a major evolution of the framework. The biggest change is the move to async/await for all server-side database operations.\n\nInstead of \`Collection.insert()\`, you now use \`Collection.insertAsync()\`. This applies to all MongoDB operations: \`findOneAsync\`, \`updateAsync\`, \`removeAsync\`, and \`findFetchAsync\`.\n\nMethods must be declared \`async\` when doing database work. Publications still return sync cursors — you use \`find()\` (not \`findAsync\`) and return the cursor directly.\n\nClient-side minimongo remains synchronous, so your Blaze helpers and reactive computations work exactly as before.`,
    role: 'editor',
    daysAgo: 6,
  },
  {
    title: 'Understanding Async Methods in Meteor 3',
    body: `In Meteor 3, all server-side methods that perform database operations must be async.\n\nBefore (Meteor 2): Methods used synchronous calls like Tasks.insert().\nAfter (Meteor 3): Methods must use await Tasks.insertAsync().\n\nOn the client, use Meteor.callAsync() instead of Meteor.call(). The method stub (optimistic UI) still runs synchronously on the client.`,
    role: 'editor',
    daysAgo: 5,
  },
  {
    title: 'Built-in Roles and Permissions',
    body: `Since Meteor 3.1, the roles package is built into core. No more alanning:roles!\n\nKey features:\n- Hierarchical roles (admin > moderator > editor > viewer)\n- Granular permissions as roles (posts.create, comments.delete)\n- Scoped roles for multi-tenant apps\n- Async API on server, sync on client\n\nIn Blaze templates, use the isInRole helper. Don't forget to publish role assignments to the client!`,
    role: 'admin',
    daysAgo: 4,
  },
  {
    title: 'MJML Email Templates in Meteor',
    body: `MJML is a markup language for responsive emails. It compiles to battle-tested HTML that works in every email client.\n\nInstall it with meteor npm install mjml. Create templates in private/email-templates/ and load them with Assets.getTextAsync().\n\nUse dupontbertrand:mail-preview to preview emails at /__meteor_mail__/ during development — no SMTP server needed!`,
    role: 'editor',
    daysAgo: 3,
  },
  {
    title: 'Rspack: The New Bundler',
    body: `Meteor 3.4 ships with Rspack, a Rust-based bundler that replaces the legacy Isobuild bundler for client and server code.\n\nBenefits:\n- Faster builds — Rspack is significantly faster than webpack\n- HMR — Hot Module Replacement for instant feedback\n- Tree shaking — Dead code elimination\n- Compatible — Drop-in replacement, same config API as webpack\n\nNote: some npm packages with dynamic require() calls (like MJML) need to be added to externals in the server config.`,
    role: 'admin',
    daysAgo: 2,
  },
  {
    title: 'Migration Guide: Meteor 2 to 3',
    body: `This guide covers the key changes when migrating from Meteor 2 to Meteor 3.\n\n1. Async Database Operations — Replace insert with insertAsync, etc.\n2. Node.js 22 — Check your npm dependencies for compatibility.\n3. Fibers Removal — Any code relying on synchronous server-side behavior must use async/await.\n4. Package Updates — Many community packages have been updated.\n5. Built-in Roles — Switch from alanning:roles to the built-in roles package.\n6. Rspack — Consider adopting Rspack for faster builds.`,
    role: 'editor',
    daysAgo: 1,
    hidden: true,
  },
];

const SEED_COMMENTS = [
  { postIndex: 0, role: 'viewer', text: 'Great introduction! The async changes took me a while to get used to.' },
  { postIndex: 0, role: 'moderator', text: 'We should add a section about publications.' },
  { postIndex: 2, role: 'editor', text: 'The hierarchical roles are really powerful. Love the built-in Blaze helper.' },
  { postIndex: 3, role: 'viewer', text: 'mail-preview is a game changer for dev workflow!' },
  { postIndex: 4, role: 'editor', text: 'Rspack builds are noticeably faster. Worth the switch.' },
];

async function seedPosts(userIds) {
  if (await Posts.find().countAsync() > 0) return;

  const postIds = [];
  for (const { title, body, role, daysAgo, hidden } of SEED_POSTS) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    const postId = await Posts.insertAsync({
      title,
      body,
      authorId: userIds[role],
      hidden: hidden || false,
      createdAt,
      updatedAt: createdAt,
    });
    postIds.push(postId);
  }

  for (const { postIndex, role, text } of SEED_COMMENTS) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - SEED_POSTS[postIndex].daysAgo + 0.5);
    await Comments.insertAsync({
      postId: postIds[postIndex],
      authorId: userIds[role],
      text,
      createdAt,
    });
  }
}

Meteor.startup(async () => {
  await seedRoles();
  const userIds = await seedUsers();
  await seedPosts(userIds);
});
