import {publicFormRoute} from '@/server/http/public-form'
import {limitRequestBody} from '@/server/http/request-body'
import {cvMaxBytes} from '@/server/security/uploads'
import {validate} from '@holo-js/forms'
import {careerApplicationForm} from '@/server/http/controllers/career-application-schema'
import {submitApplication} from '@/server/services/careers/submissions'

export const createApplication = publicFormRoute(async (request: Request) => {
  const limitedRequest = await limitRequestBody(request, cvMaxBytes + 256 * 1024)
  if (!limitedRequest) {
    return Response.json({ok: false, valid: false, status: 413, values: {}, errors: {cv: ['file']}}, {status: 413})
  }
  const input = await validate(limitedRequest, careerApplicationForm, {throttle: 'career-application'})
  const {locale} = await submitApplication(input)
  return Response.json({ok: true, status: 200, data: {redirectTo: locale === 'en' ? '/thank-you' : `/${locale}/thank-you`}})
})
