import {defineSeeder} from '@holo-js/db'
import {cmsLocales} from '@/lib/cms/contracts'
import {localizeContent} from '@/lib/catalog/localized-content'
import {getCatalogSeedContent} from '../seed-data/catalog-seed-content'
import Product from '@/server/models/Product'
import ProductApplication from '@/server/models/ProductApplication'
import ProductApplicationTranslation from '@/server/models/ProductApplicationTranslation'
import ProductCategory from '@/server/models/ProductCategory'
import ProductCategoryTranslation from '@/server/models/ProductCategoryTranslation'
import ProductTranslation from '@/server/models/ProductTranslation'
import ConcentrationRange from '@/server/models/ConcentrationRange'
import ConcentrationRangeTranslation from '@/server/models/ConcentrationRangeTranslation'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export default defineSeeder({
  name: 'product_catalog',
  async run() {
    const catalog = getCatalogSeedContent()

    for (const [group, Model, Translation] of [
      ['applications', ProductApplication, ProductApplicationTranslation],
      ['concentrations', ConcentrationRange, ConcentrationRangeTranslation],
    ] as const) {
      for (const [sortOrder, option] of catalog.settings[group].entries()) {
        const record = await Model.firstOrCreate(
          {slug: option.id},
          {is_active: true, sort_order: sortOrder},
        )
        for (const locale of cmsLocales) {
          const foreignKey = group === 'applications'
            ? {application_id: Number(record.id)}
            : {concentration_id: Number(record.id)}
          await Translation.upsert({...foreignKey, locale}, {name: option.label[locale]})
        }
      }
    }

    const categoryIds = new Map<number, number>()
    for (const category of catalog.categories) {
      const existing = await ProductCategory.where('seed_key', category.content.seedKey!).first()
      const record = existing ?? await ProductCategory.create({
        seed_key: category.content.seedKey,
        slug: category.slug,
        published: category.published,
        sort_order: category.sort_order,
      })
      categoryIds.set(category.id, Number(record.id))
      if (existing) continue

      const {name, description, seo} = category.content
      const content = Object.fromEntries(Object.entries(category.content).filter(([key]) => !['name', 'description', 'seo', 'seedKey'].includes(key)))
      for (const locale of cmsLocales) {
        await ProductCategoryTranslation.create({
          category_id: Number(record.id),
          locale,
          name: name[locale],
          description: description[locale],
          seo_title: seo.title[locale],
          seo_description: seo.description[locale],
          content: localizeContent(content, locale),
        })
      }
    }

    for (const product of catalog.products) {
      const categoryId = categoryIds.get(product.category_id)!
      const existing = await Product.where('category_id', categoryId).where('slug', product.slug).first()
      if (existing) {
        if (existing.seed_key !== product.content.seedKey) await existing.update({seed_key: product.content.seedKey})
        continue
      }
      const record = await Product.create({
        seed_key: product.content.seedKey,
        category_id: categoryId,
        slug: product.slug,
        published: product.published,
        sort_order: product.sort_order,
      })

      for (const [relation, Model, slugs] of [
        ['applications', ProductApplication, product.content.applications],
        ['concentrations', ConcentrationRange, product.content.concentrations],
      ] as const) {
        const options = await Model.whereIn('slug', slugs).get()
        const ids = slugs.map(slug => Number(options.find(option => option.slug === slug)!.id))
        await record[relation]().sync(ids)
        for (const [sortOrder, optionId] of ids.entries()) {
          await record[relation]().updateExistingPivot(optionId, {sort_order: sortOrder})
        }
      }

      const {name, description, seo} = product.content
      const content = Object.fromEntries(Object.entries(product.content).filter(([key]) => !['name', 'description', 'seo', 'seedKey', 'applications', 'concentrations'].includes(key)))
      for (const locale of cmsLocales) {
        await ProductTranslation.create({
          product_id: Number(record.id),
          locale,
          name: name[locale],
          description: description[locale],
          seo_title: seo.title[locale],
          seo_description: seo.description[locale],
          content: localizeContent(content, locale),
        })
      }
    }

    const value = Object.fromEntries(Object.entries(catalog.settings).filter(([key]) => !['applications', 'concentrations'].includes(key)))
    await WebsiteSetting.firstOrCreate({setting_key: 'catalog'}, {value})
  },
})
