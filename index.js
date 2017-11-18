'use strict';

/*
	Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
	Licensed under the Amazon Software License (the "License"). You may not use this file except
	in compliance with the License. A copy of the License is located at
		http://aws.amazon.com/asl/
	or in the "LICENSE.txt" file accompanying this file.
	This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
	express or implied. See the License for the specific language governing permissions and
	limitations under the License.
*/
/*
 * This code sample demonstrates an implementation of the Lex Code Hook Interface
 * in order to serve a bot which is used to order coffee.
 *
 * For instructions on how to set up and test this bot, as well as additional samples,
 *  visit the Lex Getting Started documentation.
 *
 * This example is intentionally simplistic for illustration; please consider using
 * the Amazon Lex blueprints for your projects.
 */
// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ElicitSlot',
			intentName,
			slots,
			slotToElicit,
			message,
			responseCard,
		},
	};
}

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ConfirmIntent',
			intentName,
			slots,
			message,
			responseCard,
		},
	};
}

function close(sessionAttributes, fulfillmentState, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Close',
			fulfillmentState,
			message,
			responseCard,
		},
	};
}

function delegate(sessionAttributes, slots) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Delegate',
			slots,
		},
	};
}



// ---------------- Helper Functions --------------------------------------------------

// build a message for Lex responses
function buildMessage(messageContent) {
	return {
		contentType: 'PlainText',
		content: messageContent
	};
}

// --------------- Functions that control the skill's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering a beverage.
 * (we only support ordering a mocha for now)
 */
function orderBeverage(intentRequest, callback) {

	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;

	if (source === 'DialogCodeHook') {

		// perform validation on the slot values we have
		const slots = intentRequest.currentIntent.slots;

		const beverageType = (slots.BeverageType ? slots.BeverageType : null);
		const beverageSize = (slots.BeverageSize ? slots.BeverageSize : null);
		const beverageTemp = (slots.BeverageTemp ? slots.BeverageTemp : null);

		if (! (beverageType && (beverageType === 'mocha'))) {

			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'BeverageType', buildMessage('Sorry, but we can only make a mocha2 today.  What kind of beverage would you like?')));
		}

		// let's assume we only accept short, tall, grande, venti, small, medium, and large for now
		if (! (beverageSize && beverageSize.match(/short|tall|grande|venti|small|medium|large/))) {
			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'BeverageSize'));
		}

		// let's say we need to know temperature for mochas
		if (! (beverageTemp && beverageTemp.match(/kids|hot|iced/))) {
			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'BeverageTemp'));
		}

		// if we've come this far, then we simply defer to Lex
		callback(delegate(outputSessionAttributes, slots));
		return;
	}

	callback(close(outputSessionAttributes, 'Fulfilled', {
		contentType: 'PlainText',
		content: `Great!  Your mocha will be available for pickup soon.  Thanks for using CoffeeBot!`
	}));
}


function applyLoan(intentRequest, callback) {

	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;

	if (source === 'DialogCodeHook') {

		// perform validation on the slot values we have
		const slots = intentRequest.currentIntent.slots;

		const loanAmount = (slots.LoanAmount ? slots.LoanAmount : null);
		const tenure = (slots.Tenure ? slots.Tenure : null);
		const fullName = (slots.FullName ? slots.FullName : null);
		const myKadNumber = (slots.MyKadNumber ? slots.MyKadNumber : null);
		const mobileNumber = (slots.MobileNumber ? slots.MobileNumber : null);
		const address = (slots.Address ? slots.Address : null);
		const emailAddress = (slots.EmailAddress ? slots.EmailAddress : null);
		const grossIncome = (slots.GrossIncome ? slots.GrossIncome : null);

		if (loanAmount && !(parseInt(loanAmount) > 0)) {

			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'LoanAmount', buildMessage('Sorry, but loan amount must be more than zero.  How much of loan amount would you like?')));
		}

		if (tenure && !(+tenure > 0)) {
			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'Tenure', buildMessage('Sorry, but tenure must be more than zero.  How long of tenure would you like?')));
		}

		if (grossIncome && !(+grossIncome > 0)) {
			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
				slots, 'GrossIncome', buildMessage('Sorry, but gross income must be more than zero.  How much is your monthly gross income?')));
		}

		// if we've come this far, then we simply defer to Lex
		callback(delegate(outputSessionAttributes, slots));
		return;
	}

	callback(close(outputSessionAttributes, 'Fulfilled', {
		contentType: 'PlainText',
		content: `Great!  Your loan application will be processed and you will be informed very soon.  Thanks for using Jack Sparrow!`
	}));
}

function getHelp(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;

	callback(close(outputSessionAttributes, 'Fulfilled', {
		contentType: 'PlainText',
		content: 'Welcome to Jack Sparrow loan assistant.  How can I help you?' 
	}));

}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {

	console.log(`dispatch userId=${intentRequest.userId}, intent=${intentRequest.currentIntent.name}`);

	const name = intentRequest.currentIntent.name;

	// dispatch to the intent handlers
	switch(name) {
		case 'fiuHelpIntent':
			return getHelp(intentRequest, callback);
			break;

		case 'fiuApplyLoanIntent':
			return applyLoan(intentRequest, callback);
			break;

		default:
			throw new Error(`Intent with name ${name} not supported`);
	}

}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {

	console.log(JSON.stringify(event));

	try {
		console.log(`event.bot.name=${event.bot.name}`);

		// fail if this function is for a different bot
		if (event.bot.name !== 'JackSparrow') {
		     callback('Invalid Bot Name');
		}
		dispatch(event, (response) => callback(null, response));
	} catch (err) {
		callback(err);
	}
};
