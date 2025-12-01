import { prisma } from '@/lib/db'
import { createLogger } from '../lib/logger'

const logger = createLogger('UsersService')

export interface UpsertUserData {
  email?: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
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
   * @param data - User data from Clerk (email, username, firstName, lastName, imageUrl)
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
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        },
        create: {
          id: userId,
          email: data.email || `${userId}@clerk.user`, // Fallback email if not provided
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
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
