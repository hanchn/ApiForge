import { request } from '../runtime/clientProvider'

export type GetUserParams = { id: string }
export type GetUserResponse = any

export async function get_users_by_id(params: GetUserParams): Promise<GetUserResponse> {
  const url = `/users/${encodeURIComponent(params.id)}`
  return request<GetUserResponse>('GET', url, undefined, { })
}