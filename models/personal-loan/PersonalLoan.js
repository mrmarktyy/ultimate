var keystone = require('keystone')
var uuid = require('node-uuid')
var frequency = require('../attributes/frequency')
var availableOptions = require('../attributes/availableOptions')
var productCommonAttributes = require('../common/ProductAttributes')
var personalLoanConstant = require('../constants/PersonalLoanConstant')
var changeLogService = require('../../services/changeLogService')
var verifiedService = require('../../services/verifiedService')
var discontinuedService = require('../../services/discontinuedService')
var verifiedCommonAttribute = require('../common/verifiedCommonAttribute')

var utils = keystone.utils
var Types = keystone.Field.Types

var PersonalLoan = new keystone.List('PersonalLoan', {
  track: true,
})

PersonalLoan.add(productCommonAttributes)

PersonalLoan.add({
  isPersonalLoanPromoted: { type: Types.Boolean, indent: true, default: false },
  isCarLoanPromoted: { type: Types.Boolean, indent: true, default: false },
  isBadCreditProduct: { type: Types.Boolean, indent: true, default: false },
  hookEnabled: { type: Types.Boolean, default: true },
  isRentalBondAllowed: { type: Types.Boolean, indent: true, default: true },
  existsOnSorbet: { type: Types.Boolean, indent: true, default: false },
  company: {
    type: Types.Relationship,
    ref: 'Company',
    required: true,
    initial: true,
    index: true,
    noedit: true,
  },
  isCarLoan: { type: Types.Select, initial: true, required: true, options: availableOptions.yesNo, emptyOption: false },
  isPersonalLoan: { type: Types.Select, initial: true, required: true, options: availableOptions.yesNo, emptyOption: false },
  isGreenLoan: { type: Types.Select, initial: true, required: true, options: availableOptions.yesNo, emptyOption: false },
  isLineOfCredit: { type: Types.Select, initial: true, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  repaymentType: { type: Types.Select, initial: true, required: true, options: ['FIXED', 'VARIABLE'], emptyOption: false },
  isExtraRepaymentsAllowed: { type: Types.Select, initial: true, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  hasRedrawFacility: { type: Types.Select, initial: true, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  securedType: { type: Types.Select, initial: true, required: true, options: ['SECURED', 'UNSECURED'], emptyOption: false },
	instantApproval: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
	timeToFunding: {type: Types.Number, min: 0},
  applicationFeesDollar: { type: Types.Number, initial: true, min: 0 },
  applicationFeesPercent: { type: Types.Number, initial: true, min: 0, max: 100 },
  ongoingFees: { type: Types.Number, initial: true, default: 0, min: 0 },
  ongoingFeesFrequency: {
    type: Types.Select,
    options: frequency,
    required: true,
    initial: true,
  },
  legacyCode: { type: Types.Text },
  ecpc: { type: Types.Number, noedit: true, default: 0 },
  docReleaseFees: { type: Types.Number, min: 0, initial: true, required: true },
  isSecuredByVehicle: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isSecuredByProperty: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isSecuredByDeposit: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  securedByOthers: { type: Types.Text },
  isSpecial: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isRCSpecial: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  specialConditions: { type: Types.Text },
  isRestrictedToCurrentHLCustomer: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  minimumYearsAddress: { type: Number, min: 0 },
  otherBenefits: { type: Types.Text },
  otherRestrictions: { type: Types.Text },
  adminNotes: { type: Types.Text },
  isNewCarAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isUsedCarAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isMotorcycleAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isBoatAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isStudentLoanAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isDebtConsolidationAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isRenovationAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isSharesAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isHolidaysAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isMedicalBillAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  isWeddingAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
	allPurposesAllowed: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  otherPurposes: { type: Types.Text },
  repaymentFrequency: {
    type: Types.MultiSelect,
    options: frequency,
  },
  extraRepaymentDollarLimits: { type: Types.Number, min: 0 },
  extraRepaymentDollarLimitsPeriod: { type: Types.Number, min: 0 },
  extraRepaymentPercentageLimits: { type: Types.Number, min: 0, max: 100 },
  extraRepaymentPercentageLimitsPeriod: { type: Types.Number, min: 0 },
  encumberanceCheckFees: { type: Types.Number, min: 0 },
  isFullyDrawnAdvance: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  redrawActivationFee: { type: Types.Number, min: 0 },
  minRedrawAmount: { type: Types.Number, min: 0 },
  hasEarlyExitPenalty: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  missedPaymentPenalty: { type: Types.Number, default: 0, min: 0, initial: true, required: true },
  earlyExitPenaltyFee: { type: Types.Number, min: 0 },
  earlyExitPenaltyFeePeriod: { type: Types.Number, min: 0 },
  hasEarlyExitPenaltyFeeVaries: { type: Types.Select, required: true, options: availableOptions.all, emptyOption: false, default: availableOptions.unknown },
  otherFees: { type: Types.Text },
  comparisonRateDisclaimer: {type: Types.Code, height: 50, language: 'html'},
  monthlyClicks: {type: Types.Number, noedit: true, min: 0, default: 0},
  personalisedFeeMinimum: { type: Types.Number },
  personalisedFeeMaximum: { type: Types.Number },
  personalisedFeeName: { type: Types.Text },
  minimumCarAge: { type: Types.Number },
	maximumCarAge: { type: Types.Number },
	carLoanDisplayName: {type: Types.Text},
})

PersonalLoan.relationship({ path: 'personalLoanVariations', ref: 'PersonalLoanVariation', refPath: 'product' })
PersonalLoan.relationship({ path: 'ChangeLogs', ref: 'ChangeLog', refPath: 'model', many: true })
PersonalLoan.relationship({ path: 'personalLoanSpecial', ref: 'PersonalLoanSpecial', refPath: 'product' })

PersonalLoan.schema.index({ company: 1, name: 1 }, { unique: true })
PersonalLoan.schema.index({ company: 1, slug: 1 }, { unique: true })
PersonalLoan.schema.set('toObject', { getters: true })
PersonalLoan.schema.set('toJSON', { getters: true, virtuals: false })
PersonalLoan.add(verifiedCommonAttribute)
PersonalLoan.schema.pre('validate', function (next) {
  if ((this.applicationFeesDollar === undefined) && (this.applicationFeesPercent === undefined)) {
    next(Error('Application Fee need to fill in either Dollar or Percent'))
  }
  if ((this.extraRepaymentDollarLimits !== undefined) && (this.isExtraRepaymentsAllowed !== availableOptions.yes)) {
    next(Error('Extra Repayments must be YES if Extra Repayment Dollar Limits is not empty'))
  }
  if ((this.extraRepaymentDollarLimitsPeriod !== undefined) && (this.isExtraRepaymentsAllowed !== availableOptions.yes)) {
    next(Error('Extra Repayments must be YES if Extra Repayment Dollar Limits Period is not empty'))
  }
  if ((this.extraRepaymentPercentageLimits !== undefined) && (this.isExtraRepaymentsAllowed !== availableOptions.yes)) {
    next(Error('Extra Repayments must be YES if Extra Repayment Percentage Limits is not empty'))
  }
  if ((this.extraRepaymentPercentageLimitsPeriod !== undefined) && (this.isExtraRepaymentsAllowed !== availableOptions.yes)) {
    next(Error('Extra Repayments must be YES if Extra Repayment Percentage Limits Period is not empty'))
  }
  if ((this.extraRepaymentDollarLimits === undefined) !== (this.extraRepaymentDollarLimitsPeriod === undefined)) {
    next(Error('Extra Repayments Dollar limits and Extra Repayment Dollar Limits Period must both empty or not empty'))
  }
  if ((this.extraRepaymentPercentageLimits === undefined) !== (this.extraRepaymentPercentageLimitsPeriod === undefined)) {
    next(Error('Extra Repayments Percentage limits and Extra Repayment Percentage Limits Period must both empty or not empty'))
  }
  if (this.isMonetized && this.isDiscontinued) {
     next(Error('You cannot discontinue a variation that is monetized.'))
  }
  if ((this.personalisedFeeMinimum || this.personalisedFeeMaximum || this.personalisedFeeName) && (!this.personalisedFeeMinimum || !this.personalisedFeeName || !this.personalisedFeeName)) {
    next(Error('If any of personalisedFeeMinimum, personalisedFeeMaximum or personalisedFeeName are filled, all have to be filled'))
  }
  if (this.personalisedFeeMinimum !== null && this.personalisedFeeMaximum !== null && this.personalisedFeeMinimum > this.personalisedFeeMaximum) {
    next(Error('personalisedFeeMinimum has to be less or equal to personalisedFeeMaximum'))
  }
  next()
})

PersonalLoan.schema.virtual('personalLoanTotalUpfrontFee').get(function () {
  if (this.isPersonalLoan === availableOptions.yes) {
    if (this.applicationFeesDollar != null) {
      return this.applicationFeesDollar
    } else if (this.applicationFeesPercent != null) {
      return this.applicationFeesPercent * personalLoanConstant.PERSONAL_LOAN_DEFAULT_LOAN_AMOUNT * 0.01
    }
  } else {
    return null
  }
})

PersonalLoan.schema.virtual('personalLoanTotalUpfrontFee30000').get(function () {
  if (this.isPersonalLoan === availableOptions.yes) {
    if (this.applicationFeesDollar != null) {
      return this.applicationFeesDollar
    } else if (this.applicationFeesPercent != null) {
      return this.applicationFeesPercent * personalLoanConstant.PERSONAL_LOAN_30000_LOAN_AMOUNT * 0.01
    }
  } else {
    return null
  }
})

PersonalLoan.schema.virtual('carLoanTotalUpfrontFee').get(function () {
  if (this.isCarLoan === availableOptions.yes) {
    if (this.applicationFeesDollar != null) {
      return this.applicationFeesDollar
    } else if (this.applicationFeesPercent != null) {
      return this.applicationFeesPercent * personalLoanConstant.CAR_LOAN_DEFAULT_LOAN_AMOUNT * 0.01
    }
  } else {
    return null
  }
})

PersonalLoan.schema.virtual('totalMonthlyFee').get(function () {
  if (this.ongoingFeesFrequency === 'Monthly') {
    return this.ongoingFees
  } else {
    return 0
  }
})

PersonalLoan.schema.virtual('totalYearlyFee').get(function () {
  if (this.ongoingFeesFrequency === 'Annually') {
    return this.ongoingFees
  } else {
    return 0
  }
})

PersonalLoan.schema.pre('save', async function (next) {
  if (!this.uuid) {
    this.uuid = uuid.v4()
  }
  if (!this.slug) {
    this.slug = utils.slug(this.name.toLowerCase())
  }
  if (utils.slug(this.slug.toLowerCase()) !== this.slug) {
    this.slug = utils.slug(this.slug.toLowerCase())
  }

  let product = await PersonalLoan.model.findOne({uuid: this.uuid}).lean().exec()
  if (product && product.isDiscontinued != this.isDiscontinued) {
    const urlsToBeUpdated = []
    const variations = await keystone.list('PersonalLoanVariation').model.find({product: this._id}).populate('company').lean().exec()
    if (variations && variations.length) {
      for(let variation of variations) {
        if (product.isCarLoan == availableOptions.yes) {
          urlsToBeUpdated.push(`/car-loans/${variation.company.slug}/${product.slug}`)
          urlsToBeUpdated.push(`/car-loans/${variation.company.slug}/${product.slug}/payments`)
        }
        if (product.isPersonalLoan == availableOptions.yes) {
          urlsToBeUpdated.push(`/personal-loans/${variation.company.slug}/${product.slug}`)
          urlsToBeUpdated.push(`/personal-loans/${variation.company.slug}/${product.slug}/payments`)
        }
      }
    }
    urlsToBeUpdated.length && await discontinuedService(this, { urls: urlsToBeUpdated, isDiscontinued: this.isDiscontinued })
  }
  await changeLogService(this)
  next()
})

PersonalLoan.schema.post('save', async function () {
	await verifiedService(this)
})

PersonalLoan.schema.methods.remove = function (callback) {
  this.isDiscontinued = true
  return this.save(callback)
}

PersonalLoan.defaultColumns = 'name, company, isCarLoan, isPersonalLoan, isMonetized, applicationFeesDollar, applicationFeesPercent'
PersonalLoan.defaultSort = 'isDiscontinued'
PersonalLoan.searchFields = 'name, legacyCode'
PersonalLoan.drilldown = 'company'
PersonalLoan.register()
