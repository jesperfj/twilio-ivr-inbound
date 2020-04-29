var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const iam = new AWS.IAM();
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


async function createContactsTable(prefix) {
  let response = {}
  response.tableName = `${prefix}-contacts`
  try {
    const params = {
      TableName: response.tableName,
      AttributeDefinitions: [
        {AttributeName: 'phoneNumber',AttributeType: 'S'}
      ],
      KeySchema: [
        {AttributeName: 'phoneNumber',KeyType: 'HASH'}
        //{AttributeName: 'aRange',KeyType: 'RANGE'}
      ],
      ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      StreamSpecification: {StreamEnabled: false}
    };
    
    // Call DynamoDB to create the table
    const createresult = await ddb.createTable(params).promise()
    response.tableArn = createresult.TableDescription.TableArn
    console.log(createresult)
  }
  catch(error) {
    console.error("Failed: "+error)
  }
  return response
}

async function deleteContactsTable(prefix) {
  try  {
    const result = await ddb.deleteTable({TableName: `${prefix}-contacts`}).promise()
    console.log(result)
  }
  catch(error) {
    console.error("Failed: "+error)
  }
}

async function createUser(prefix) {
  let response = {}
  try {
    var params = {
      UserName: `${prefix}-user`
    };
    response.iamUser = `${prefix}-user`
    const result = await iam.createUser(params).promise()
    console.log(result)
    const credresult = await iam.createAccessKey(params).promise()
    response.accessKeyId = credresult.AccessKey.AccessKeyId
    response.secretAccessKey = credresult.AccessKey.SecretAccessKey
    console.log(credresult)
    const policyresult = await iam.putUserPolicy({
      PolicyDocument: policy([`${prefix}-contacts`]),
      PolicyName: 'DynamoDBAccess',
      UserName: `${prefix}-user`
    }).promise()
    console.log(policyresult)
  } catch(error) {
    console.log("Error: "+error)
  }
  return response
}

async function deleteUser(prefix) {
  try {
    const result1 = await iam.deleteUserPolicy({ UserName: `${prefix}-user`, PolicyName: "DynamoDBAccess"}).promise()
    console.log(result1)
  } catch(error) {
    console.error("deleteUserPolicy failed: "+error)
  }
  try {
    const result21 = await iam.listAccessKeys({ UserName: `${prefix}-user`}).promise()
    console.log(result21)
    for(key of result21.AccessKeyMetadata) {
      const result22 = await iam.deleteAccessKey({ UserName: `${prefix}-user`, AccessKeyId: key.AccessKeyId}).promise()
      console.log(result22)
    }
  } catch(error) {
    console.error("deleteAccessKey failed: "+error)
  }
  try {
    const result3 = await iam.deleteUser({ UserName: `${prefix}-user`}).promise()
    console.log(result3)
  } catch(error) {
    console.error("deleteUser failed: "+error)
  }
}

async function createAll(prefix) {
  let response = {}
  const tasks = [
    createContactsTable,
    createUser
  ]

  for(t of tasks) {
    try {
      console.log(t)
      const resp = await t(prefix)
      response = {...response, ...resp}
    } catch(error) {
      console.log(error)
    }
  }
  return response
}

async function deleteAll(prefix) {
  const tasks = [
    deleteContactsTable,
    deleteUser
  ]

  for(t of tasks) {
    try {
      console.log(t)
      await t(prefix)
    } catch(error) {
      console.log(error)
    }
  }
}

function policy(tableNames) {
  let policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "ListAndDescribe",
        "Effect": "Allow",
        "Action": [
          "dynamodb:List*",
          "dynamodb:DescribeReservedCapacity*",
          "dynamodb:DescribeLimits",
          "dynamodb:DescribeTimeToLive"
        ],
        "Resource": "*"
      },
      {
        "Sid": "SpecificTable",
        "Effect": "Allow",
        "Action": [
          "dynamodb:BatchGet*",
          "dynamodb:DescribeStream",
          "dynamodb:DescribeTable",
          "dynamodb:Get*",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWrite*",
          "dynamodb:CreateTable",
          "dynamodb:Delete*",
          "dynamodb:Update*",
          "dynamodb:PutItem"
        ]
      }
    ]
  }
  const resources = tableNames.map(name => { return `arn:aws:dynamodb:*:*:table/${name}`})
  //policy.Statement[1].Resource = `arn:aws:dynamodb:*:*:table/${tableName}`  
  policy.Statement[1].Resource = resources
  return JSON.stringify(policy)
  
}

module.exports = {
  createContactsTable,
  deleteContactsTable,
  createUser,
  deleteUser,
  createAll,
  deleteAll
}