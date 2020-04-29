const dbsetup = require("./dbsetup")
const dbstore = require("./functions/datastore.protected.js")

function name(appInfo) {
    return `${appInfo.serviceName}-${appInfo.serviceSid}`
}

async function install(app) {
    console.log("Allocating US phone number in 323 area code ($1/month)")
    const result = await app.twilioClient.incomingPhoneNumbers.create({
        areaCode: '323',
        friendlyName: app.prefix,
        voiceUrl: `https://${app.domain}/ivr`
    })
    console.log(`Allocated phone number ${result.phoneNumber}`)

    // This next line will create a DynamoDB table in your AWS account assuming you're
    // logged in via AWS CLI (creds in ~/.aws/credentials).
    // You can comment it out if you don't want to perform this step. The IVR will use
    // a Dummy contact store and be somewhat less interesting.
    const dbresp = await dbsetup.createAll(app.prefix)

    console.log(`Created DynamoDB table ${dbresp.tableName} and IAM user ${dbresp.iamUser}`)

    await app.setVariables({
        AWS_ACCESS_KEY: dbresp.accessKeyId,
        AWS_SECRET_ACCESS_KEY: dbresp.secretAccessKey,
        APP_PREFIX: app.prefix
    })
    res = await app.getVariables()
    console.log("Set variables for serverless function:")
    console.log(res)
}

async function uninstall(app) {
    console.log("Deleting AWS resources")
    await dbsetup.deleteAll(app.prefix)
    console.log(`Looking for number ${app.prefix}`)
    const numbers = await app.twilioClient.incomingPhoneNumbers.list({ friendlyName: app.prefix })
    if(numbers.length==0) {
        console.log(`Phone number ${app.prefix} not found`)
    } else if(numbers.length>1) {
        console.log(`Found more than 1 phone number matching ${app.prefix}. Please review manually`)
        return
    } else {
        console.log(`Deleting phone number ${app.prefix}`)
        app.twilioClient.incomingPhoneNumbers(numbers[0].sid).remove()
    }
}

// These functions can be called with `twilio installer:run <function-name>`.

async function listContacts(app,argv) {
    const db = new dbstore.DynamoContactStore(await app.getVariables())
    console.log(await db.getAllContacts())
}

async function putContact(app,argv) {
    const db = new dbstore.DynamoContactStore(await app.getVariables())
    db.putContact({
        phoneNumber: argv[1],
        name: argv[2]
    })
}

async function deleteContact(app,argv) {
    const db = new dbstore.DynamoContactStore(await app.getVariables())
    db.deleteContact(argv[1])
}


module.exports = {
    install,
    uninstall,
    listContacts,
    putContact,
    deleteContact
}