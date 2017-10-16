var keystone = require('keystone')
var uuid = require('node-uuid')
var productCommonAttributes = require('../common/ProductCommonAttributes')
var frequency = require('../attributes/frequency')
var availableOptions = require('../attributes/availableOptions')
var changeLogService = require('../../services/changeLogService')
var utils = keystone.utils
var Types = keystone.Field.Types

var BankAccount = new keystone.List('BankAccount', {
    track: true,
})

BankAccount.add(productCommonAttributes)
BankAccount.add({
	company: {
    type: Types.Relationship,
    ref: 'Company',
    required: true,
    initial: true,
    index: true,
    noedit: true,
  },
	legacyCode: { type: Types.Text, index: true },
	minimumOpeningAmount: { type: Types.Number, default: 0 },
	minimumBalance: { type: Types.Number },
	minimumDepositRequiredForFeeFree: { type: Types.Number },
	minimumDepositRequiredForFreeFrequency: { type: Types.Select, options: frequency },
	minimumAgeRestrictions: { type: Types.Number },
	maximumAgeRestrictions: { type: Types.Number },
	linkedAccountRequired: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	jointApplicationAvailable: { type: Types.Select, options: availableOptions.all, default: availableOptions.yes },
	hasChequeServices: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasAtmAccess: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasEftposFacility: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasInternetBanking: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasPhoneBanking: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasApp: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasBranchAccess: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	hasOverdraftFacility: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	accountKeepingFee: { type: Types.Number },
	accountKeepingFeesFrequency: { type: Types.Select, options: frequency },
	internetTransactionFee: { type: Types.Number },
	phoneTransactionFee: { type: Types.Number },
	eftposFee: { type: Types.Number },
	chequeFee: { type: Types.Number },
	chequeDishonourFee: { type: Types.Number },
	overseasEftposFee: { type: Types.Number },
	overseasATMWithdrawalFee: { type: Types.Number },
	foreignTransactionFee: { type: Types.Number },
	counterDepositFee: { type: Types.Number },
	counterWithdrawalFee: { type: Types.Number },
	freeCounterTransactionCount: { type: Types.Number },
	atmWithdrawalFee: { type: Types.Number },
	otherBankATMWithdrawalFee: { type: Types.Number },
	dailyATMwithdrawalLimit: { type: Types.Number },
	networkBankATMFeeWaiver: { type: Types.Boolean, default: false },
	interestCalculationFrequency: { type: Types.Select, options: frequency },
	interestPaymentFrequency: { type: Types.Select, options: frequency },
	isInterestPaidinSteps: { type: Types.Select, options: availableOptions.all, default: availableOptions.unknown },
	minimumBalanceToActivateInterestRate: { type: Types.Number },
	interestRate: { type: Types.Number },
	smartPaySupport: { type: Types.Select, options: 'Apple Pay, Goolge Wallet, Samsung Pay, Tap and Go' },
	debitCardTypes: { type: Types.Select, options: 'Visa, Master Card' },
	rewardsPointProgram: { type: Types.Text },
	uniqueFeatures: { type: Types.TextArray },
	additionalBenefits: { type: Types.TextArray },
	restrictions: { type: Types.TextArray },
})

BankAccount.relationship({ path: 'ChangeLogs', ref: 'ChangeLog', refPath: 'model', many: true })
BankAccount.schema.index({ company: 1, name: 1 }, { unique: true })
BankAccount.schema.index({ company: 1, slug: 1 }, { unique: true })

BankAccount.schema.pre('validate', function (next) {
	if ((this.minimumAgeRestrictions !== undefined) && ((this.maximumAgeRestrictions !== undefined)) && (this.minimumAgeRestrictions > this.maximumAgeRestrictions)) {
    next(Error('Minimum Age Restrictions cannot be greater than Maximum Age Restrictions'))
  }
  next()
})

BankAccount.schema.pre('save', async function (next) {
  if (!this.uuid) {
    this.uuid = uuid.v4()
  }
  if (!this.slug) {
    let slug = utils.slug(this.name.toLowerCase())
    this.slug = slug
  }

  await changeLogService(this)
  next()
})

BankAccount.defaultColumns = 'name, company, uuid, slug'
BankAccount.searchFields = 'name, legacyCode'
BankAccount.drilldown = 'company'
BankAccount.register()