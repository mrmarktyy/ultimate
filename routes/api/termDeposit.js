var keystone = require('keystone')
var removeUneededFields = require('../../utils/removeUneededFields')
var setPromotedOrder = require('../../utils/helperFunctions').setPromotedOrder
var TermDeposit = keystone.list('TermDeposit')
var TermDepositTier = keystone.list('TermDepositTier')
var TermDepositCompany = keystone.list('TermDepositCompany')
var monetizedCollection = require('./monetizedCollection')

exports.list = async function (req, res) {
  let termDeposits = await TermDeposit.model.find().populate('company').lean().exec()
  let result = await customizeTermDeposit(termDeposits)
  res.jsonp(result)
}

async function customizeTermDeposit (termDeposits) {
	const variations = await TermDepositTier.model.find().populate('product').lean().exec()
	const termDepositsCompanies = await TermDepositCompany.model.find().populate('big4ComparisonProduct').lean().exec()
	const monetizedList = await monetizedCollection('Term Deposits')

	let result = termDeposits.map((termDeposit) => {
		let company = Object.assign({}, termDeposit.company)
		termDeposit.variations = variations
			.filter((variation) => variation.product.uuid === termDeposit.uuid)
			.map((variation) => {
				variation = removeUneededFields(variation, ['product', 'company'])
				if(typeof variation.minimumDeposit === 'undefined' || variation.minimumDeposit === null) {
					variation.minimumDeposit = 0
				}
				if(typeof variation.maximumDeposit === 'undefined' || variation.maximumDeposit === null) {
					variation.maximumDeposit = 99999999
				}
				return variation
			})
		let companyVertical = termDepositsCompanies.filter((termDepositCompany) => {
			return String(termDepositCompany.company) === String(termDeposit.company._id)
		})[0]

		company.logo = company.logo && company.logo.url
		termDeposit.company = company
		termDeposit.company.big4ComparisonProductUuid = null

		let monetize = monetizedList[termDeposit._id]
		termDeposit.gotoSiteUrl = monetize ? monetize.applyUrl : null
		termDeposit.gotoSiteEnabled = monetize ? monetize.enabled : false
		termDeposit.paymentType = monetize ? monetize.paymentType : null

		termDeposit.company.hasRepaymentWidget = companyVertical ? companyVertical.hasRepaymentWidget : false
		termDeposit.company.removeBig4ComparisonProduct = companyVertical ? companyVertical.removeBig4ComparisonProduct : false
		setPromotedOrder(termDeposit)
		return removeUneededFields(termDeposit)
	})

	return result
}