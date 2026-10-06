import { defineSecurityConfig, limit } from '@holo-js/security'
import {accountRateLimitKey, publicRateLimitKey} from '../lib/security/rate-limit.mjs'

export default defineSecurityConfig({
  csrf: {
    enabled: true,
    field: '_token',
    header: 'X-CSRF-TOKEN',
    cookie: 'XSRF-TOKEN',
    except: [],
  },
  rateLimit: {
    driver: 'file',
    file: {
      path: './storage/framework/rate-limits',
    },
    redis: {
      connection: 'default',
      prefix: 'holo:rate-limit:',
    },
    limiters: {
      'login': limit.perMinute(5).by(accountRateLimitKey),
      'register': limit.perHour(10).by(publicRateLimitKey),
      'career-application': limit.perHour(10).by(publicRateLimitKey),
      'contact-enquiry': limit.perHour(20).by(publicRateLimitKey),
      'quote-enquiry': limit.perHour(20).by(publicRateLimitKey),
      'meeting-reservation': limit.perHour(10).by(publicRateLimitKey),
    },
  },
})
