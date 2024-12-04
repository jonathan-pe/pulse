import { GraphQLClient, RequestDocument } from 'graphql-request'

const getClient = async () => {
  return new GraphQLClient(`${process.env.BACKEND_URL!}/graphql`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
}

export const fetcher = async <T>(query: RequestDocument, variables?: Record<string, any>): Promise<T> => {
  try {
    const client = await getClient()
    return await client.request<T>(query, variables)
  } catch (error: any) {
    console.error(error)
    throw new Error(error.response?.errors?.[0]?.message ?? 'An error occurred')
  }
}
