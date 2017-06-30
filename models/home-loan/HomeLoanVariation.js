var keystone = require('keystone')
var uuid = require('node-uuid')
var Types = keystone.Field.Types
var Fee = keystone.list('Fee')
var productCommonAttributes = require('../common/ProductCommonAttributes')
var ComparisonRateCalculator = require('../../services/ComparisonRateCalculator')
var changeLogService = require('../../services/changeLogService')
var utils = keystone.utils

var HomeLoanVariation = new keystone.List('HomeLoanVariation', {
  track: true,
})

HomeLoanVariation.add(productCommonAttributes)

HomeLoanVariation.add({
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
		ref: 'HomeLoan',
		required: true,
		initial: true,
		index: true,
		noedit: true,
		filters: {company: ':company'},
	},
	name: {type: Types.Text, required: true, initial: true, index: true},
	neo4jId: {type: Types.Number, noedit: true},
	legacyCode: {type: Types.Text, noedit: true},
	ecpc: {type: Types.Number, noedit: true},
	monthlyClicks: {type: Types.Number, noedit: true, min: 0, default: 0},
	fixMonth: {type: Types.Number, initial: true},
	minTotalLoanAmount: {type: Types.Number, initial: true},
	maxTotalLoanAmount: {type: Types.Number, initial: true},
	minLVR: {type: Types.Number, initial: true},
	maxLVR: {type: Types.Number, initial: true},
	rate: {type: Types.Number, initial: true, required: true},
	comparisonRate: {type: Types.Number, initial: true},
	calculatedComparisonRate: {type: Types.Number, initial: true, noedit: true},
	revertRate: {type: Types.Number, initial: true},
	introductoryRate: {type: Types.Number, initial: true},
	introductoryTerm: {type: Types.Number, initial: true},
	revertVariation: {
		type: Types.Relationship,
		ref: 'HomeLoanVariation',
		initial: true,
    noedit: false,
		filters: {company: ':company'},
	},
  removeRevertVariation: {type: Types.Boolean, indent: true, initial: false},
})

HomeLoanVariation.schema.pre('validate', async function (next) {
  let homeloan = await keystone.list('HomeLoan').model.findOne({_id: this.product}).lean().exec()
  if (homeloan.isDiscontinued) {
    next(Error('A variation can only be created on an active product'))
  }
  if ((this.minTotalLoanAmount > this.maxTotalLoanAmount) && this.maxTotalLoanAmount != null) {
    next(Error('Max Total LoanAmount can not less than Min Total Loan Amount'))
  }
  if (this.minLVR < 0 || this.minLVR > 100) {
    next(Error('Min LVR need to between 0 and 100 inclusive'))
  }
  if (this.maxLVR < 0 || this.maxLVR > 100) {
    next(Error('Max LVR need to between 0 and 100 inclusive'))
  }
  if ((this.minLVR > this.maxLVR) && this.maxLVR != null) {
    next(Error('Max LVR can not less than Min LVR'))
  }
  if (this.introductoryRate > this.rate) {
    next(Error('Introductory Rate need to less or equal than Rate'))
  }
  if (this.fixMonth && !this.revertRate && (!this.revertVariation || (this.revertVariation && this.removeRevertVariation))) {
    next(Error('This is a Variation for Fix HomeLoan. Need either a revertRate or revertVariation'))
  }
  if (this.fixMonth && this.revertRate && this.revertVariation && !this.removeRevertVariation) {
    next(Error('Only one revert info needed. Either a revertRate or a revertVariation'))
  }
  if (this.isMonetized && this.isDiscontinued) {
     next(Error('You cannot discontinue a variation that is monetized.'))
  }
  next()
})

HomeLoanVariation.schema.pre('save', async function (next) {
  if (this.removeRevertVariation) {
    this.revertVariation = null
  }
  this.removeRevertVariation = undefined
  if (!this.uuid) {
    this.uuid = uuid.v4()
  }
  if (!this.slug) {
    this.slug = utils.slug(this.name.toLowerCase())
  }

  await changeLogService(this)

  let loan = {
    totalYearlyFees: 0,
    totalMonthlyFees: 0,
    totalUpfrontFees: 0,
    totalEndOfLoanFees: 0,
  }
  let fees = await Fee.model.find({product: this.product}).exec()
  fees.forEach((fee) => {
    if (['SETTLEMENT_FEE', 'VALUATION_FEE', 'LEGAL_FEE', 'APPLICATION_FEE',
        'MANDATORY_RATE_LOCK_FEE'].indexOf(fee.feeType) >= 0) {
      loan.totalUpfrontFees += fee.fixedCost
    }
    if (fee.feeType === 'DISCHARGE_FEE') {
      loan.totalEndOfLoanFees += fee.fixedCost
    }
    if (fee.feeType === 'ONGOING_FEE' && fee.frequency ==='ANNUALLY') {
      loan.totalYearlyFees += fee.fixedCost
    }
    if (fee.feeType === 'ONGOING_FEE' && fee.frequency ==='MONTHLY') {
      loan.totalMonthlyFees  += fee.fixedCost
    }
  })

  if (this.fixMonth) { // Fix product
    loan.yearlyIntroRate = this.rate
    loan.introTermInMonth = this.fixMonth
    if (this.revertRate) {
      loan.yearlyRate = this.revertRate
    } else {
      let variation = await HomeLoanVariation.model.findOne({'_id': this.revertVariation}).exec()
      loan.yearlyRate = variation.rate
    }
  } else { // Variable product
    loan.yearlyRate = this.rate
    loan.yearlyIntroRate = this.introductoryRate
    loan.introTermInMonth = this.introductoryTerm
  }
  this.calculatedComparisonRate = ComparisonRateCalculator.calculateHomeLoanComparisonRate(loan)

  next()
})

HomeLoanVariation.schema.methods.remove = function (callback) {
  this.isDiscontinued = true
  return this.save(callback)
}

HomeLoanVariation.defaultSort = 'isDiscontinued'
HomeLoanVariation.defaultColumns = 'name|40%, company, rate, revertRate, introductoryRate isDiscontinued'
HomeLoanVariation.register()
