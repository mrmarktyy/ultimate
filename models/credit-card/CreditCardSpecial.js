const keystone = require('keystone')
const Types = keystone.Field.Types
const specialAttributes = require('./SpecialAttributes')

const CreditCardSpecial = new keystone.List('CreditCardSpecial', {
  track: true,
})

CreditCardSpecial.add(specialAttributes)
CreditCardSpecial.add({
  company: {
    type: Types.Relationship,
    ref: 'Company',
    required: true,
    initial: true,
    index: true,
  },
  product: {
    type: Types.Relationship,
    ref: 'CreditCard',
    required: false,
    initial: true,
    index: true,
    filters: { company: ':company' },
  },
})

CreditCardSpecial.schema.pre('validate', async function (next) {
  if (!!this.endDate && this.startDate > this.endDate) {
    next(Error('Start date cannot be past the end date.'))
  }
  let currentDate = new Date()
  if (this.startDate <= currentDate && (((!!this.endDate && this.endDate >= currentDate) || !this.endDate))) {
    let specials = []

    if (this.product) {
      specials = await keystone.list('CreditCardSpecial').model.find({
        product: this.product,
        _id: {$ne: this.id},
        $or: [
          {startDate: {$lte: new Date()}, $and: [{endDate: {$exists: true}}, {endDate: {$gte: new Date()}}]},
          {startDate: {$lte: new Date()}, endDate: {$exists: false}},
        ],
      }).populate('company product').lean().exec()
    } else {
      specials = await keystone.list('CreditCardSpecial').model.find({
        product: {$ne: null},
        _id: {$ne: this.id},
        $or: [
          {startDate: {$lte: new Date()}, $and: [{endDate: {$exists: true}}, {endDate: {$gte: new Date()}}]},
          {startDate: {$lte: new Date()}, endDate: {$exists: false}},
        ],
      }).populate('company product').lean().exec()
    }
    let companySpecials = await keystone.list('CreditCardSpecial').model.find({
      company: this.company,
      product: null,
      _id: {$ne: this.id},
      $or: [
        {startDate: {$lte: new Date()}, $and: [{endDate: {$exists: true}}, {endDate: {$gte: new Date()}}]},
        {startDate: {$lte: new Date()}, endDate: {$exists: false}},
      ],
    }).populate('company').lean().exec()
    specials = specials.concat(companySpecials)
    if (specials.length) {
      next(Error(`There is already an active special Company: ${specials[0].company.name} ${specials[0].product ? ' Name: ' + specials[0].product.name : ''}`))
    }
  }
  if (!this.type.includes(this.defaultType) && this.type.length > 1) {
    next(Error('default type has to be one of the types presented.'))
  }
  next()
})

CreditCardSpecial.schema.pre('save', function (next) {
  if (this.removeSpecialsEndDate) {
    this.endDate = null
  }
  this.removeSpecialsEndDate = undefined
  if (this.type.length === 1 && this.defaultType !== this.type[0]) {
    this.defaultType = this.type[0]
  }
  next()
})

CreditCardSpecial.defaultColumns = 'name, type, introText, blurb'
CreditCardSpecial.searchFields = 'name, type, introText, blurb'
CreditCardSpecial.register()
