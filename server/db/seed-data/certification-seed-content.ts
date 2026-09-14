import type {CertificationData} from '@/lib/certifications/contracts'
import snapshot from './reference-seeds.json'

export function getCertificationSeedContent(): CertificationData {
  return structuredClone(snapshot.certifications) as CertificationData
}
