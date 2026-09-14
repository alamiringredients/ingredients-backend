const values = {
  name: ["Full name", "الاسم الكامل", "Nom complet"],
  email: ["Email address", "البريد الإلكتروني", "Adresse e-mail"],
  phone: ["Phone number", "رقم الهاتف", "Téléphone"],
  department: ["Department", "القسم", "Département"],
  letter: [
    "Cover letter (optional)",
    "خطاب تقديمي (اختياري)",
    "Lettre de motivation (facultatif)",
  ],
  cv: [
    "CV (PDF or DOCX, up to 10 MB)",
    "السيرة الذاتية (PDF أو DOCX، حتى 10 ميجابايت)",
    "CV (PDF ou DOCX, 10 Mo maximum)",
  ],
  consent: [
    "I agree to the processing of my details for recruitment.",
    "أوافق على معالجة بياناتي لأغراض التوظيف.",
    "J’accepte le traitement de mes données pour le recrutement.",
  ],
  privacy: ["Privacy policy", "سياسة الخصوصية", "Politique de confidentialité"],
  submit: ["Submit application", "إرسال الطلب", "Envoyer la candidature"],
  sending: ["Submitting…", "جارٍ الإرسال…", "Envoi…"],
  success: [
    "Your application has been received.",
    "تم استلام طلبك.",
    "Votre candidature a été reçue.",
  ],
  invalid: [
    "Please complete the required fields and consent.",
    "يرجى استكمال الحقول المطلوبة والموافقة.",
    "Veuillez remplir les champs obligatoires et donner votre accord.",
  ],
  file: [
    "Upload a valid PDF or DOCX no larger than 10 MB.",
    "يرجى رفع ملف PDF أو DOCX صالح لا يتجاوز 10 ميجابايت.",
    "Importez un PDF ou DOCX valide de 10 Mo maximum.",
  ],
  closed: [
    "This role is no longer accepting applications.",
    "لم يعد هذا المنصب يستقبل طلبات.",
    "Ce poste n’accepte plus de candidatures.",
  ],
  failed: [
    "Could not submit your application. Please try again.",
    "تعذر إرسال طلبك. يرجى المحاولة مرة أخرى.",
    "Impossible d’envoyer votre candidature. Veuillez réessayer.",
  ],
  rate: [
    "Please wait before submitting another application.",
    "يرجى الانتظار قبل إرسال طلب آخر.",
    "Veuillez patienter avant d’envoyer une autre candidature.",
  ],
  apply: ["Apply for this role", "تقدم لهذه الوظيفة", "Postuler"],
  allJobs: [
    "All open positions",
    "جميع الوظائف الشاغرة",
    "Tous les postes ouverts",
  ],
  viewRole: ["View role", "عرض الوظيفة", "Voir le poste"],
  roleSummary: ["Role summary", "ملخص الوظيفة", "Résumé du poste"],
  location: ["Location", "الموقع", "Lieu"],
  contract: ["Contract", "نوع التعاقد", "Contrat"],
  experience: ["Experience", "الخبرة", "Expérience"],
  reportsTo: ["Reports to", "المسؤول المباشر", "Responsable"],
  closing: ["Closing date", "موعد الإغلاق", "Date de clôture"],
  readMore: ["Read article", "قراءة المقال", "Lire l’article"],
  speculative: [
    "Speculative application",
    "طلب توظيف عام",
    "Candidature spontanée",
  ],
  careers: ["Careers", "الوظائف", "Carrières"],
  home: ["Home", "الرئيسية", "Accueil"],
  job: ["Position", "الوظيفة", "Poste"],
  breadcrumb: ["Breadcrumb", "مسار التنقل", "Fil d’Ariane"],
  applyIntro: [
    "Tell us about your experience and attach your CV.",
    "أخبرنا عن خبراتك وأرفق سيرتك الذاتية.",
    "Présentez votre expérience et joignez votre CV.",
  ],
} as const;
export function getCareersInterfaceDefinitions() {
  return Object.entries(values).map(([key, [en, ar, fr]]) => ({
    key: `careers.interface.${key}`,
    page: "careers-interface",
    source: en,
    translations: { en, ar, fr },
  }));
}
