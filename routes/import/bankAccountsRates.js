const keystone = require('keystone')
const _ = require('lodash')
const logger = require('../../utils/logger')
const csvtojson = require('../../utils/csvToJson')
const changeCase = require('change-case')
const uuid = require('node-uuid')

const BankAccount = keystone.list('BankAccount')
const Company = keystone.list('Company')

exports.uploadCsv = async (req, res) => {
	try {
		if (Object.keys(req.files).length === 0) {
			throw 'No upload file is specified'
		}
		const list = await csvtojson(req.files.bankAccountsFileUpload.path)
		await upsertBankAccounts(list)
		req.flash('success', 'Import successfully.')
		return res.redirect('/import-rates')
	} catch (error) {
		req.flash('error', error)
		return res.redirect('/import-rates')
	}
}

async function upsertBankAccounts (list) {
	try {
		const promises = []
		for(let i = 0; i<list.length; i++) {
			const rawProduct = list[i]
			const product = await mapBankAccounts(rawProduct)
			if(!product) {
				continue
			}
			let bankAccount = await BankAccount.model.findOne({uuid: product.uuid}).exec()
			if (bankAccount) {
				_.merge(bankAccount, product)
			} else {
				bankAccount = new BankAccount.model(product)
			}
			promises.push(
				bankAccount.save((err) => {
					if (err) {
						logger.error(err)
					}
				})
			)
		}
		await Promise.all(promises)
	} catch (err) {
		logger.error(err)
		throw err
	}
}

async function mapBankAccounts (rawProduct) {
	const mapping = {
    'Slug': 'slug',
    'productName': 'name',
    'productUUID': 'uuid',
    'legacyID': 'legacyCode',
    'linkedSavingsAccount': 'linkedAccountRequired',
    'jointApplicationAvailable': 'jointApplicationAvailable',
    'uniqueFeatures': 'uniqueFeatures',
    'otherBenefits': 'additionalBenefits',
    'otherRestrictions': 'restrictions',
    'minimumAgeRestriction': 'minimumAgeRestrictions',
    'maximumAgRestriction': 'maximumAgeRestrictions',
    'minimumAccountBalanceToActivateInterestRate': 'minimumBalanceToActivateInterestRate',
    'minInterestRate%': 'minimumInterestRate',
    'maxInterestRate%': 'maximumInterestRate',
    'interestRateCalculationFrequency': 'interestCalculationFrequency',
    'interestPaymentFrequency': 'interestPaymentFrequency',
    'minimumOpeningBalance': 'minimumOpeningAmount',
    'hasAtmAccess': 'hasAtmAccess',
    'dailyAtmWithdrawalLimit': 'dailyATMwithdrawalLimit',
    'hasEftposFacility': 'hasEftposFacility',
    'hasBranchAccess': 'hasBranchAccess',
    'hasOverdraftFacility': 'hasOverdraftFacility',
    'hasInternetFacility': 'hasInternetBanking',
    'hasApp': 'hasApp',
    'hasPhoneFacility': 'hasPhoneBanking',
    'hasChequeFacility': 'hasChequeServices',
    'accountKeepingFee': 'accountKeepingFee',
    'accountKeepingFeeFrequency': 'accountKeepingFeesFrequency',
    'depositToWaiveAccountKeepingFee': 'minimumDepositRequiredForFeeFree',
    'depositToWaiveAccountKeepingFeeFrequency': 'minimumDepositRequiredForFreeFrequency',
    'cardTypeAvailable': 'debitCardTypes',
    'networkAtmFee': 'atmWithdrawalFee',
    'hasOtherBankAtmFee': 'hasOtherBankATMWithdrawalFee',
    'otherBankAtmWaiverCondition': 'OtherBankATMWithdrawalFeeCondition',
    'overseasAtmFee': 'overseasATMWithdrawalFee',
    'overTheCounterDepositFee': 'counterDepositFee',
    'overTheCounterWithdrawalFee': 'counterWithdrawalFee',
    'eftposFee': 'eftposFee',
    'overseasEftposFee': 'overseasEftposFee',
    'phoneFee': 'phoneTransactionFee',
    'internetFee': 'internetTransactionFee',
    'chequeDepositFee': 'chequeFee',
    'chequeDishonourFee': 'chequeDishonourFee',
    'foreignTransactionFeePercent': 'foreignTransactionFeePercent',
    'foreignTransactionFeeDollars': 'foreignTransactionFee',
  }
	if(!rawProduct.productName || !rawProduct.company) {
		return null
	}
	const company = await Company.model.findOne({ $or: [
		{ name: { $regex: new RegExp(`^${rawProduct.company}$`, 'i') } },
		{ displayName: { $regex: new RegExp(`^${rawProduct.company}$`, 'i') } },
		{ shortName: { $regex: new RegExp(`^${rawProduct.company}$`, 'i') } },
		{ otherNames: { $regex: new RegExp(`^${rawProduct.company}$`, 'i') } },
	] }).exec()
	if(!company) {
		return null
	}
	const product = {}
	for(let key in mapping) {
		const value = parseFloat(rawProduct[key])
		if(key === 'productUUID') {
			product[mapping[key]] = rawProduct[key]
		}
		else if(!_.isNaN(value)) {
			product[mapping[key]] = value
		} else {
			product[mapping[key]] = rawProduct[key]
		}
	}
	product.company = company._id
	product.uuid = rawProduct.productUUID ? rawProduct.productUUID : uuid.v4()
	product.slug = rawProduct.slug ? rawProduct.slug : changeCase.paramCase(rawProduct.productName.toLowerCase())
	const smartPaySupport = []
	rawProduct.applePayAvailable.toLowerCase() === 'yes' ? smartPaySupport.push('Apple Pay') : null
	rawProduct.androidPayAvailable.toLowerCase() === 'yes' ? smartPaySupport.push('Google Wallet') : null
	rawProduct.samsungPayAvailable.toLowerCase() === 'yes' ? smartPaySupport.push('Samsung Pay') : null
	product.smartPaySupport = smartPaySupport
	product.restrictions = rawProduct.restrictions ? [rawProduct.restrictions] : []
	product.uniqueFeatures = rawProduct.uniqueFeatures ? [rawProduct.uniqueFeatures] : []
	product.additionalBenefits = rawProduct.additionalBenefits ? [rawProduct.additionalBenefits] : []
	for(let key in product) {
		if(product[key] === '') {
			delete product[key]
		}
	}
	return product
}