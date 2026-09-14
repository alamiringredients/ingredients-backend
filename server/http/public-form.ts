import {isValidationException} from '@holo-js/forms'

const errorCodes = new Set(['invalid', 'file', 'closed', 'failed', 'rate'])

export function publicFormRoute(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      const validation = isValidationException(error)
      const status = validation ? Number(error.status) : 500
      const errors = status === 429 ? {_root: ['rate']}
        : validation ? Object.fromEntries(Object.entries(error.errors.flatten()).map(([field, codes]) => [
          field, codes.map(code => errorCodes.has(code) ? code : field === '_root' ? 'failed' : 'invalid'),
        ])) : {_root: ['failed']}
      return Response.json({ok: false, valid: false, status, values: {}, errors}, {status})
    }
  }
}
