var keystone = require('keystone')
var Types = keystone.Field.Types

var CompanyHomeLoan = new keystone.List('CompanyHomeLoan', {
	track: true,
})

CompanyHomeLoan.add({
	company: {
		type: Types.Relationship,
		ref: 'Company',
		required: true,
		initial: true,
		unique: true,
		index: true,
		noedit: true,
	},
	homeLoanBlurb: {type: Types.Code, height: 250, language: 'html'},
})

CompanyHomeLoan.defaultColumns = 'company'
CompanyHomeLoan.register()