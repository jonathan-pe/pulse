import { prisma } from '@/lib/db'
import { createLogger } from '../lib/logger'

const logger = createLogger('UsersService')

export interface UpsertUserData {
  email?: string
  username?: string | null
  displayName?: string | null
  imageUrl?: string | null
}

export interface UpdateUserData {
  username?: string
  displayName?: string | null
}

/**
 * UsersService - Handles all user-related business logic
 */
export class UsersService {
  /**
   * Ensure user exists in database (upsert based on Clerk userId)
   * This is called when a Clerk user signs in to sync them to our database
   *
   * @param userId - Clerk user ID
   * @param data - User data from Clerk (email, username, displayName, imageUrl)
   * @returns The user record
   */
  async ensureUserExists(userId: string, data: UpsertUserData = {}) {
    try {
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: {
          // Update fields if provided
          ...(data.email && { email: data.email }),
          ...(data.username !== undefined && { username: data.username }),
          ...(data.displayName !== undefined && { displayName: data.displayName }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        },
        create: {
          id: userId,
          email: data.email || `${userId}@clerk.user`, // Fallback email if not provided
          username: data.username,
          displayName: data.displayName,
          imageUrl: data.imageUrl,
        },
      })

      logger.info('User ensured in database', { userId, email: user.email })
      return user
    } catch (error) {
      logger.error('Failed to upsert user', { userId, data, error })
      throw error
    }
  }
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    })
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.username !== undefined && { username: data.username }),
          ...(data.displayName !== undefined && { displayName: data.displayName }),
        },
      })

      logger.info('User updated', { userId, updates: data })
      return user
    } catch (error) {
      logger.error('Failed to update user', { userId, data, error })
      throw error
    }
  }

  /**
   * Delete user and all related data
   * This should be called when a user deletes their Clerk account
   */
  async deleteUser(userId: string) {
    try {
      await prisma.user.delete({
        where: { id: userId },
      })

      logger.info('User deleted', { userId })
    } catch (error) {
      logger.error('Failed to delete user', { userId, error })
      throw error
    }
  }
}

// Export singleton instance
export const usersService = new UsersService()
