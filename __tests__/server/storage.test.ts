import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { db } from '../../server/db';
import storage from '../../server/storage';
import { users, userPreferences, roleEnum } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('User Preferences', () => {
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: roleEnum.enumValues[0],
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    // Insert test user
    await db.insert(users).values(testUser);
  });

  afterEach(async () => {
    // Clean up user preferences after each test
    await db.delete(userPreferences).where(eq(userPreferences.userId, testUser.id));
  });

  afterAll(async () => {
    // Clean up test user
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it('should create user preferences', async () => {
    const preference = {
      userId: testUser.id,
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
    };

    const createdPreference = await storage.createUserPreference(preference);

    expect(createdPreference).toMatchObject({
      userId: testUser.id,
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
    });
  });

  it('should get user preferences', async () => {
    const preference = {
      userId: testUser.id,
      theme: 'dark',
      language: 'ko',
      emailNotifications: true,
      pushNotifications: false,
    };

    await storage.createUserPreference(preference);
    const retrievedPreference = await storage.getUserPreferences(testUser.id);

    expect(retrievedPreference).toMatchObject(preference);
  });

  it('should update user preferences', async () => {
    // Create initial preference
    await storage.createUserPreference({
      userId: testUser.id,
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
    });

    const updates = {
      theme: 'dark',
      language: 'ko',
      emailNotifications: false
    };

    const result = await storage.updateUserPreferences(testUser.id, updates);
    
    expect(result).toMatchObject({
      userId: testUser.id,
      theme: 'dark',
      language: 'ko',
      emailNotifications: false,
      pushNotifications: true // ?´ì „ ê°?? ì?
    });
    
    // updatedAt??ë³€ê²½ë˜?ˆëŠ”ì§€ ?•ì¸
    expect(result.updatedAt).not.toEqual(result.createdAt);
  });

  it('should throw error if preferences do not exist', async () => {
    const updates = { theme: 'dark' };
    
    await expect(
      storage.updateUserPreferences('non-existent-user-id', updates)
    ).rejects.toThrow('User preferences not found');
  });
});
