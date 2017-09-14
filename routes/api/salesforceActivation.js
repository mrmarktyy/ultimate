var keystone = require('keystone')
var salesforceVerticals = require('../../models/helpers/salesforceVerticals')
var mongoose = require('mongoose')
var Monetize = keystone.list('Monetize').model
var Log = keystone.list('Log')
var logger = require('../../utils/logger')

function log (event, response) {
  (new Log.model({event: event, message: JSON.stringify(response)})).save((error) => {
    if (error) {
      logger.error(error)
    }
  })
}

exports.monetize = function (req, res) {
  log('salesforce-incoming', req.body)

  let products = req.body
  let missingUUIDs = []
  let promise
  let promises = []

  for (var i = 0; i < products.length; i++) {
    let changeRequest = products[i]
    let [ultimateVertical, collection] = translateSalesforceVertical(changeRequest.RC_Product_Type)
    if (ultimateVertical === false) {
      continue
    }
    let uuid = changeRequest.RC_Product_ID

    let product = keystone.list(collection)
    promise = product.model.findOne({ uuid: uuid }).populate('company')
    .exec()
    .then((product) => {
      if (product === null) {
        missingUUIDs.push(uuid)
      } else {
        let ProductModel = mongoose.model(collection)
        return(ProductModel.findOneAndUpdate(
          {
            uuid: uuid,
          },
          {
            isMonetized: changeRequest.RC_Active,
          },
          {
            new: true,
          }, (err) => {
            if (err) {
              let comment = 'database error on salesforce monetize display on product uuid ' + uuid + ' ' + err
              throw comment
            }
            Monetize.findOneAndUpdate(
            {
              uuid: uuid,
            },
            {
              vertical: ultimateVertical,
              applyUrl: changeRequest.RC_Url,
              product: product._id,
              productName: product.name,
              companyName: product.company.name,
              enabled: changeRequest.RC_Active,
              updatedAt: new Date().toISOString(),
            },
            {
              new: true,
              upsert: true,
            }, (err) => {
              if (err) {
                let comment = 'database error on salesforce monetize update on uuid ' + uuid + ' ' + err
                throw comment
              }
            }
            )
          }
        ))
      }
    })
    .catch((err) => {
      logger.error(err)
      let response = { error: err }
      log('salesforce-response', response)
      res.jsonp(response)
    })

    promises.push(promise)

  }
  Promise.all(promises).then(() => {
    if (missingUUIDs.length === 0) {
      let response = { text: 'OK' }
      log('salesforce-response', response)
      res.status(200).jsonp(response)
    } else {
      let response = { message: 'Missing UUIDs', missing: missingUUIDs }
      log('salesforce-response', response)
      res.status(400).jsonp(response)
    }
  })
}

function translateSalesforceVertical (vertical) {
  let ultimateVertical = Object.keys(salesforceVerticals).filter((key) => {
    return salesforceVerticals[key].salesforceVertical === vertical
  })[0]
  if (typeof ultimateVertical === 'undefined'){
    return [false, false]
  }
  return [ultimateVertical, salesforceVerticals[ultimateVertical].collection]
}

