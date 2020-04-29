const AWS = require('aws-sdk');

function newDataStore(context) {
  return context.AWS_ACCESS_KEY ? 
    new DynamoContactStore(context) :
    new DummyContactStore(context)
}

class DynamoContactStore {
  constructor(context) {
    AWS.config.update( {
      accessKeyId: context.AWS_ACCESS_KEY, 
      secretAccessKey: context.AWS_SECRET_ACCESS_KEY, 
      region: 'us-east-1'
    });
    this.docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})
    // this should come from context
    this.prefix = context.APP_PREFIX
  }

  async getContact(phoneNumber) {
    const params = {
      TableName: `${this.prefix}-contacts`,
      Key: {phoneNumber: phoneNumber}
    }
    try {
      const result = await this.docClient.get(params).promise()
      console.log(result)
      return result.Item
    } catch(error) {
      console.error("Failed getCRM: "+error)
      return null
    }
  }

  async putContact(record) {
    const params = {
      TableName: `${this.prefix}-contacts`,
      Item: record
    }
  
    try {
      const result = await this.docClient.put(params).promise()
      console.log(result)
    }
    catch(error){
      console.error("Failed: "+error)
    }
  }

  async getAllContacts() {
    // Warning: only fetches first batch
    const params = {
      TableName: `${this.prefix}-contacts`,
    }
    return (await this.docClient.scan(params).promise()).Items;
  }

  async deleteContact(key) {
    const params = {
      TableName: `${this.prefix}-contacts`,
      Key: {phoneNumber: key}
    }
    await this.docClient.delete(params).promise()
  }
}


class DummyContactStore {
  constructor(context) {

  }

  async getContact(phoneNumber) {
    console.log(`DummyContactStore looking up ${phoneNumber}`)
    return { phoneNumber: phoneNumber, name: "Stranger" }
  }

  async putContact(record) {
    console.log(`NOOP: Put record ${record}`)
  }

  async getAllContacts() {
    return [ { phoneNumber: "+14443332222", name: "Stranger"}]

  }

  async deleteContact(key) {
    console.log(`NOOP: delete record ${key}`)
  }
}


module.exports = {
  DynamoContactStore,
  DummyContactStore,
  newDataStore
}