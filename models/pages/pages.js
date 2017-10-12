var keystone = require('keystone')
var uuid = require('node-uuid')
var Types = keystone.Field.Types
var verticals = require('../helpers/verticals')

const Pages = new keystone.List('Pages', {track: true}).add({
	uuid: {type: Types.Text, initial: true, unique: true},
	url: {type: Types.Text, initial: true, unique: true},
	header: {type: Types.Text, initial: true},
	tagline: {type: Types.Text, initial: true},
	title: {type: Types.Text, initial: true},
	vertical: {type: Types.Select, options: verticals, initial: true},
	resultName: {type: Types.Text},
	description: {type: Types.Code, height: 250, language: 'html'},
	keywords: {type: Types.Text},
	canonical: {type: Types.Text},
	category: {type: Types.TextArray},
	userJourneyStage: {type: Types.Text},
	og: {
		id: {type: Types.Text},
		title: {type: Types.Text},
		description: {type: Types.Text},
		image: {type: Types.Text},
	},
	twitter: {
		title: {type: Types.Text},
		description: {type: Types.Text},
		creator: {type: Types.Text},
		image: {type: Types.Text},
	},
	google: {
		name: {type: Types.Text},
		description: {type: Types.Text},
		image: {type: Types.Text},
	},
	featuredImage: { type: Types.Url },
})
Pages.schema.pre('save', async function (next) {
	if (!this.uuid) {
		this.uuid = uuid.v4()
	}
	next()
})

Pages.defaultColumns = 'uuid, url, title, tagline, vertical'
Pages.register()

