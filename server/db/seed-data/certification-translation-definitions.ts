import type {CertificationStatus} from '@/lib/certifications/contracts'

const certificationCopy = {
  en: {group: 'Al Amir Group', facility: 'Alamir Ingredients · Sadat City', entries: 'credentials', target: 'Target', unconfirmed: 'Target date to be confirmed', issued: 'Issued', expires: 'Expires', download: 'Download certificate', downloads: 'View available certificates', marks: 'Certification marks'},
  ar: {group: 'مجموعة الأمير', facility: 'الأمير للمكونات · مدينة السادات', entries: 'اعتمادات', target: 'الموعد المستهدف', unconfirmed: 'سيتم تأكيد الموعد المستهدف', issued: 'تاريخ الإصدار', expires: 'تاريخ الانتهاء', download: 'تحميل الشهادة', downloads: 'عرض الشهادات المتاحة', marks: 'شعارات الاعتمادات'},
  fr: {group: 'Al Amir Group', facility: 'Alamir Ingredients · Sadat City', entries: 'accréditations', target: 'Objectif', unconfirmed: 'Date cible à confirmer', issued: 'Délivré le', expires: 'Expire le', download: 'Télécharger le certificat', downloads: 'Voir les certificats disponibles', marks: 'Marques de certification'},
}

export const certificationStatuses: Record<'en' | 'ar' | 'fr', Record<CertificationStatus, string>> = {
  en: {planned: 'Planned', 'in-progress': 'In progress', held: 'Held', suspended: 'Suspended', expired: 'Expired'},
  ar: {planned: 'مخطط لها', 'in-progress': 'قيد التنفيذ', held: 'حاصل عليها', suspended: 'معلقة', expired: 'منتهية'},
  fr: {planned: 'Prévue', 'in-progress': 'En cours', held: 'Obtenue', suspended: 'Suspendue', expired: 'Expirée'},
}

export function getCertificationTranslationDefinitions() {
  const values = [
    ...Object.keys(certificationCopy.en).map(key => ({source: certificationCopy.en[key as keyof typeof certificationCopy.en], ar: certificationCopy.ar[key as keyof typeof certificationCopy.ar], fr: certificationCopy.fr[key as keyof typeof certificationCopy.fr]})),
    ...Object.keys(certificationStatuses.en).map(key => ({source: certificationStatuses.en[key as CertificationStatus], ar: certificationStatuses.ar[key as CertificationStatus], fr: certificationStatuses.fr[key as CertificationStatus]})),
    {source: 'PDF', ar: 'PDF', fr: 'PDF'},
  ]
  return values.map(({source, ar, fr}) => ({key: `certification.interface.${source.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}`, page: 'certification-interface', source, translations: {en: source, ar, fr}}))
}
