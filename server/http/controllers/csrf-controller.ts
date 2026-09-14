import {csrf} from '@holo-js/security'

export async function issueCsrfToken(request: Request) {
  const token = await csrf.token(request)
  return Response.json(
    {token},
    {headers: {'Set-Cookie': await csrf.cookie(request, token), 'Cache-Control': 'no-store'}},
  )
}
