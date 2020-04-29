# Streamline inbound calls with an interactive voice response system

This repo sets up a sample IVR on Twilio. Once deployed, you can test how it works and then modify it to your needs. You can send your calls to the IVR by configuring simple call forwarding on your current number.

## Pre-requisites

[Sign up for a Twilio account](https://www.twilio.com/try-twilio) if you don't have one. Your computer must have [Node.js v10](https://nodejs.org/en/download/) or higher. Install Twilio CLI with

    $ npm install -g twilio-cli

Install the CLI installer plugin with

    $ twilio plugins:install https://github.com/jesperfj/plugin-twilioapp

It will prompt for a y/N since this is an untrusted installation source.

## Install the IVR app on Twilio

Clone the repo to your computer and open a terminal in the repo directory. Run

    $ npm install
    $ twilio twilioapp:install

This will do the following

* Create a new serverless service on Twilio and deploy the IVR code in this repo
* Deploy the code to Twilio that runs the IVR
* Allocate a dedicated phone number to this IVR, costing $1 / month
* Create a DynamoDB table and IAM user in your AWS account (assuming you're logged in and have creds in `~/aws/credentials`)
* Set AWS credentials as serverless function variables. NOTE: This will set credentials for the purpose created IAM user. It will not use your main AWS credentials.

## Test

Make a call to the number created during install. If you are outside the US and don't want to make an international call, install a [simple softphone app](https://github.com/jesperfj/twilio-voip-phone) and make the call from there.

## Customize

The code defining the IVR is in [`ivr.js`](functions/ivr.js). You can change this code and redeploy using the serverless plugin. Install it with

    $ twilio plugins:install @twilio-labs/plugin-serverless

Once you've made a change, you can redeploy (without 'reinstalling') using the serverless plugin:

    $ twilio serverless:deploy

## Uninstall

While the app is installed, you will incur cost on your Twilio account. To prevent any further expenses, uninstall the app with

    $ twilio twilioapp:uninstall

