var keystone = require('keystone')
var Types = keystone.Field.Types
var changeLogService = require('../../services/changeLogService')
var verifiedService = require('../../services/verifiedService')
var verifiedCommonAttribute = require('../common/verifiedCommonAttribute')

var TermDeposit = keystone.list('TermDeposit')
var TermDepositTier = new keystone.List('TermDepositTier', {track: true}).add({
	company: {
		type: Types.Relationship,
		ref: 'Company',
		required: true,
		initial: true,
		index: true,
		noedit: true,
	},
	product: {
		type: Types.Relationship,
		ref: 'TermDeposit',
		initial: true,
		index: true,
		noedit: true,
		filters: { company: ':company' },
	},
	name: { type: Types.Text, required: true, initial: true },
	minimumDeposit: { type: Types.Number, min: 0, initial: true },
	maximumDeposit: { type: Types.Number, min: 0 },
	interestRate: { type: Types.Number, initial: true },
	term: { type: Types.Number, min: 0, initial: true, required: true },
	interestPaymentFrequencyTerm: { type: Types.Select, options: 'Annually, Monthly, Semi-Annually, Quarterly, Fortnightly, Daily, At Maturity', initial: true, required: true },
	interestCalculationFrequency: { type: Types.Select, options: 'Annually, Monthly, Semi-Annually, Quarterly, Fortnightly, Daily, At Maturity' },
})
TermDepositTier.add(verifiedCommonAttribute)
TermDepositTier.relationship({ path: 'ChangeLogs', ref: 'ChangeLog', refPath: 'model', many: true })

TermDepositTier.schema.index({ company: 1, product: 1, name: 1 }, { unique: true })

TermDeposit.schema.post('remove', (next) => {
	TermDepositTier.model.remove({ product: Object(next._id) }).exec()
})

TermDepositTier.schema.pre('save', async function (next) {
  await changeLogService(this)
  next()
})

TermDepositTier.schema.post('save', async function () {
	await verifiedService(this)
})

TermDepositTier.defaultColumns = 'name, company, product, minimumDeposit, maximumDeposit, term, interestRate, interestPaymentFrequencyTerm'
TermDepositTier.drilldown = 'company product'
TermDepositTier.register()
