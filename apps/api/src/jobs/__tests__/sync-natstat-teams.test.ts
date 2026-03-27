import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    teamProviderMapping: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { upsertNatStatProviderMapping } from '../sync-natstat-teams.js'

describe('upsertNatStatProviderMapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reconciles stale natstat mappings without violating unique constraints', async () => {
    vi.mocked(prisma.teamProviderMapping.findUnique)
      .mockResolvedValueOnce({
        id: 'mapping-by-external-id',
        teamId: 'team-old',
        provider: 'natstat',
        externalId: '123',
      } as never)
      .mockResolvedValueOnce({
        id: 'mapping-by-team',
        teamId: 'team-new',
        provider: 'natstat',
        externalId: '456',
      } as never)

    vi.mocked(prisma.teamProviderMapping.delete).mockResolvedValue({ id: 'mapping-by-team' } as never)
    vi.mocked(prisma.teamProviderMapping.update).mockResolvedValue({ id: 'mapping-by-external-id' } as never)

    await upsertNatStatProviderMapping({
      teamId: 'team-new',
      externalId: '123',
      externalCode: 'LAD',
      externalName: 'Los Angeles Dodgers',
      active: true,
      metadata: undefined,
    })

    expect(prisma.teamProviderMapping.findUnique).toHaveBeenNthCalledWith(1, {
      where: {
        provider_externalId: {
          provider: 'natstat',
          externalId: '123',
        },
      },
    })

    expect(prisma.teamProviderMapping.findUnique).toHaveBeenNthCalledWith(2, {
      where: {
        teamId_provider: {
          teamId: 'team-new',
          provider: 'natstat',
        },
      },
    })

    expect(prisma.teamProviderMapping.delete).toHaveBeenCalledWith({
      where: { id: 'mapping-by-team' },
    })

    expect(prisma.teamProviderMapping.update).toHaveBeenCalledWith({
      where: { id: 'mapping-by-external-id' },
      data: {
        teamId: 'team-new',
        externalCode: 'LAD',
        externalName: 'Los Angeles Dodgers',
        active: true,
        metadata: undefined,
      },
    })

    expect(prisma.teamProviderMapping.create).not.toHaveBeenCalled()
  })
})
