// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
const sql = require('mssql');
var conn = require('./dbConnection');
var query = require('./query');
const config = require('./config');
var messages = require('./messages.json');
const { ActivityTypes, CardFactory, builder } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { UserProfile } = require('./dialogs/greeting/userProfile');
const { WelcomeCard } = require('./dialogs/welcome');
const { GreetingDialog } = require('./dialogs/greeting');
var vehicleCard = require('./resources/vehicleResult.json');
const germanLuisKeys = require('./resources/germanLuisKeys.json');

// Greeting Dialog ID
const GREETING_DIALOG = 'greetingDialog';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'userProfileProperty';
const CONVERSATION_DATA_PROPERTY = 'conversationData';

// LUIS service type entry as defined in the .bot file.
const LUIS_CONFIGURATION = 'BasicBotLuisApplication';

// Supported LUIS Intents.
const GREETING_INTENT = 'Greeting';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';

// Supported LUIS Entities, defined in ./dialogs/greeting/resources/greeting.lu
const USER_NAME_ENTITIES = ['userName', 'userName_patternAny'];
const USER_LOCATION_ENTITIES = ['userLocation', 'userLocation_patternAny'];

//dialog code
const { ChoicePrompt, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const SHOW_CARS = 'show_cars'

/*
For second option
const SHOW_FILTER = 'show_filter'
const CAR_FILTER_PROMPT = 'car_filter_prompt'
*/
var secondOption = false;



/**
 * Demonstrates the following concepts:
 *  Displaying a Welcome Card, using Adaptive Card technology
 *  Use LUIS to model Greetings, Help, and Cancel interactions
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *  Handle conversation interruptions
 */
class BasicBot {
    /**
     * Constructs the three pieces necessary for this bot to operate:
     * 1. StatePropertyAccessor for conversation state
     * 2. StatePropertyAccess for user state
     * 3. LUIS client
     * 4. DialogSet to handle our GreetingDialog
     *
     * @param {ConversationState} conversationState property accessor
     * @param {UserState} userState property accessor
     * @param {BotConfiguration} botConfig contents of the .bot file
     */
    constructor(conversationState, userState, botConfig) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');
        if (!botConfig) throw new Error('Missing parameter.  botConfig is required');

        // Add the LUIS recognizer.
        const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
        if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configuration. Please follow README.MD to create required LUIS applications.\n\n');
        const luisEndpoint = luisConfig.region && luisConfig.region.indexOf('https://') === 0 ? luisConfig.region : luisConfig.getEndpoint();
        this.englishluisRecognizer = new LuisRecognizer({
            applicationId: luisConfig.appId,
            endpoint: luisEndpoint,
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: luisConfig.authoringKey
        },
            {
                includeAllIntents: true,
                log: true,
                staging: false,
                //spellCheck: true,
                //bingSpellCheckSubscriptionKey: '2dba9f72ff18406e955e00dd93067975'
            }, true);


        //new luis recognizer for german luis

        this.germanluisRecognizer = new LuisRecognizer({
            applicationId: germanLuisKeys.applicationId,
            endpoint: germanLuisKeys.endpoint,
            // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
            endpointKey: germanLuisKeys.authoringKey
        },
            {
                includeAllIntents: true,
                log: true,
                staging: false,
                //spellCheck: true,
                //bingSpellCheckSubscriptionKey: '2dba9f72ff18406e955e00dd93067975'
            }, true);


        // Create the property accessors for user and conversation state
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        // Create top-level dialog(s)
        this.dialogs = new DialogSet(this.dialogState);
        // Add the Greeting dialog to the set
        this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));
        //dialog code

        /*
        For second option
        this.dialogs.add(new ChoicePrompt(CAR_FILTER_PROMPT));
        this.dialogs.add(new WaterfallDialog(SHOW_FILTER, [
            this.promptForFilter.bind(this),
            this.getpromptFilterValue.bind(this)
        ]));
        */

        this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        // The state management objects for the conversation and user state.
        this.conversationState = conversationState;
        this.userState = userState;
    }

    /*
    For second option
    async getpromptFilterValue(step) {
        await step.context.sendActivity(`you have selected ${step.result.value}`);
        await step.next(-1);
    }
    async promptForFilter(step) {
        await step.prompt(CAR_FILTER_PROMPT, 'Would you like to further filter the result', ['Yes', 'No']);

    }
    */

    /**
     * Driver code that does one of the following:
     * 1. Display a welcome card upon receiving ConversationUpdate activity
     * 2. Use LUIS to recognize intents for incoming user message
     * 3. Start a greeting dialog
     * 4. Optionally handle Cancel or Help interruptions
     *
     * @param {Context} context turn context from the adapter
     */
    async onTurn(context, locale) {
        let luisRecognizer;
        if (locale === undefined || locale === '') {
            locale = "en-US";
        }

        if ((context.activity.text || '').trim().toLowerCase() === 'go to second option') {
            secondOption = false;
        }
        if ((context.activity.text || '').trim().toLowerCase() === 'go to first option') {
            secondOption = false;
        }
        const utterance = (context.activity.text || '').trim().toLowerCase();
        if (secondOption == false && (context.activity.text || '').trim().toLowerCase() != 'go to first option') {
            var setCountFlag = false;
            var selectQuery, result = '';
            if (context.activity.type === ActivityTypes.Message) {
                const conversationData = await this.conversationData.get(context, { intent: '', query: '' });

                //setting the luis recognizer
                if (locale === "de-DE") {
                    console.log("The luis recognizer to be set is German");
                    luisRecognizer = this.germanluisRecognizer;
                }
                else {
                    console.log("The luis recognizer to be set is English");
                    luisRecognizer = this.englishluisRecognizer;
                }
                // Perform a call to LUIS to retrieve results for the user's message.
                const results = await luisRecognizer.recognize(context);
                console.log("results:", results);
                const topIntent = results.luisResult.topScoringIntent;

                //Interruptions
                if (topIntent.intent === "Help") {
                    await context.sendActivity(messages[locale].help1);
                    await context.sendActivity(messages[locale].help2);
                    return;
                } else if (topIntent.intent === "Cancel") {
                    await this.conversationState.clear(context);
                    await this.conversationState.saveChanges(context);
                    await context.sendActivity(messages[locale].cancel);
                    return;
                }

                if (topIntent.intent == "SearchForCars" || topIntent.intent == "PreviousCars") {
                    selectQuery = await query.createQuery(results, conversationData);
                    console.log(selectQuery);
                    console.log(conversationData.query);
                    await this.conversationData.set(context, conversationData);
                    await this.conversationState.saveChanges(context);
                    result = await conn.getVehicles(selectQuery);
                    //await context.sendActivity(`Result : ${result}`);

                    //elimintaing the results from the previous query
                    for (var i = 0; i <= 4; i++) {
                        vehicleCard.body[0].columns[0].items[i + 1].text = "";
                        vehicleCard.body[0].columns[1].items[i + 1].text = "";
                        vehicleCard.body[0].columns[2].items[i + 1].text = "";
                    }
                    var remainingCars;
                    var y = 0;
                    var carList = result[0];
                    if (carList.length > 5) {
                        remainingCars = carList.length - 5;
                        y = 4
                    }
                    else {
                        y = carList.length - 1;
                        remainingCars = 0;
                        console.log(i);
                    }
                    for (var i = 0; i <= y; i++) {
                        vehicleCard.body[0].columns[0].items[i + 1].text = carList[i].vehicle_series;
                        vehicleCard.body[0].columns[1].items[i + 1].text = carList[i].color;
                        vehicleCard.body[0].columns[2].items[i + 1].text = carList[i].seats.toString();
                    }

                    if (remainingCars > 0) {
                        await context.sendActivity({
                            text: messages[locale].result1,
                            attachments: [CardFactory.adaptiveCard(vehicleCard)]
                        });
                    }
                    else {
                        await context.sendActivity({
                            text: messages[locale].result2,
                            attachments: [CardFactory.adaptiveCard(vehicleCard)]
                        });
                    }
                } else if (topIntent.intent == "CountOfCars") {
                    await context.sendActivity(JSON.stringify(result[0][0][""]));
                } else if (topIntent.intent == "Greeting") {
                    // console.log(messages[locale].greeting);
                    await context.sendActivity(messages[locale].greeting);
                    // console.log(messages[locale].greeting);
                } else {
                    await context.sendActivity(messages[locale].none);
                }

                // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
                console.log("topintent", topIntent);
            } else if (context.activity.type === ActivityTypes.ConversationUpdate &&
                context.activity.recipient.id !== context.activity.membersAdded[0].id) {
                // If the Activity is a ConversationUpdate, send a greeting message to the user.
                //await context.sendActivity('Welcome to the LUIS Demo sample! Send me a message and I will try to predict your intent.');
            } else if (context.activity.type !== ActivityTypes.ConversationUpdate) {
                // Respond to all other Activity types.
                await context.sendActivity(messages[locale].activity);
            }
        }
    }
}

module.exports.BasicBot = BasicBot;
