import {defineSeeder} from '@holo-js/db'
import type {WebsiteSettings} from '@/lib/cms/contracts'
import {companyInformationDefaults} from '../seed-data/company-information'
import source from '../seed-data/site-content.json'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export function getWebsiteSettingsSeedContent():WebsiteSettings {
  return {
    company: structuredClone(companyInformationDefaults),
    companyProfile:{en:'',ar:'',fr:''},
    siteName:{en:'Alamir Ingredients',ar:'الأمير للمكونات',fr:'Alamir Ingredients'},
    logo:'/assets/logo-full.svg',
    groupLogo:'/assets/logo.webp',
    icon:'/assets/icon.svg',
    defaultSeoTitle:{en:'Alamir Ingredients | From Field to Formula',ar:'الأمير للمكونات | من الحقل إلى التركيبة',fr:'Alamir Ingredients | Du champ à la formulation'},
    defaultSeoDescription:{
      en:'Premium tomato and fruit concentrates and purees, made in Egypt for food and beverage manufacturers worldwide.',
      ar:'مركزات ومهروسات طماطم وفاكهة ممتازة، مصنوعة في مصر لمصنعي الأغذية والمشروبات حول العالم.',
      fr:'Concentrés et purées de tomate et de fruits haut de gamme, fabriqués en Égypte pour les producteurs agroalimentaires du monde entier.',
    },
    socialImage:'/assets/hero-poster.webp',
  }
}

export default defineSeeder({name: 'website_settings', async run() {
  const setting = source.website_settings.find(row => row.setting_key === 'website')!
  await WebsiteSetting.firstOrCreate({setting_key: setting.setting_key}, {value: setting.value})
}})
