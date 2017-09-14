var keystone = require('keystone')
var verticals = require('../helpers/verticals')
var changeLogService = require('../../services/changeLogService')
var Types = keystone.Field.Types

var PromotedProduct = new keystone.List('PromotedProduct', {
    track: true,
})

PromotedProduct.add({
	uuid: {type: Types.Text, initial: true},
	vertical: {type: Types.Select, required: true, options: verticals, initial: true},
	title: {type: Types.Text, required: true, initial: true, index: true},
	order: {type: Types.Number, default: 1, initial: true},
	dateStart: {type: Types.Datetime, required: true, initial: true},
	dateEnd: {type: Types.Datetime, initial: true, required: true},
	pages: {type: Types.TextArray, initial: true},
	company: {
		type: Types.Relationship,
		ref: 'Company',
		required: true,
		initial: true,
		index: true,
		noedit: true,
	},
})


PromotedProduct.schema.pre('validate', function (next) {
	if ((this.dateEnd !== null) && (this.dateEnd < this.dateStart)) {
		next(Error('End date has to be greater than start date'))
	}
	next()
})

PromotedProduct.schema.index({uuid: 1, vertical: 1}, {unique: true})

PromotedProduct.schema.pre('save', async function (next) {
	if (!this.uuid) {
		this.uuid = uuid.v4()
	}
  await changeLogService(this)
  next()
})

PromotedProduct.defaultColumns = 'uuid, vertical, title, order, dateStart, dateEnd, company'
PromotedProduct.register()
