import { db } from '../config';
import { boards } from '../schema';

export default async function seedBoards() {
  console.log('Seeding boards...');
  try {
    await db.insert(boards).values([
      {
        name: 'My First Board',
        publicId: 'pub_12345678',
        slug: 'my-first-board',
        workspaceId: 1,
      },
      {
        name: 'My Second Board',
        publicId: 'pub_87654321',
        slug: 'my-second-board',
        workspaceId: 1,
      },
    ]);
    console.log('Seeding boards successful!');
  } catch (error) {
    console.error('Error seeding boards:', error);
  }
}

