// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
const sql  =  require('mssql');
var conn = require('./dbConnection');
var mapping = require('./mapping.json');
const StringBuilder = require('string-builder');  
const { ActivityTypes, CardFactory, builder } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { UserProfile } = require('./dialogs/greeting/userProfile');
const { WelcomeCard } = require('./dialogs/welcome');
const { GreetingDialog } = require('./dialogs/greeting');

// Greeting Dialog ID
const GREETING_DIALOG = 'greetingDialog';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'userProfileProperty';

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
        this.luisRecognizer = new LuisRecognizer({
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

        // Create the property accessors for user and conversation state
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        // Create top-level dialog(s)
        this.dialogs = new DialogSet(this.dialogState);
        // Add the Greeting dialog to the set
        this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));

        this.conversationState = conversationState;
        this.userState = userState;
    }

    /**
     * Driver code that does one of the following:
     * 1. Display a welcome card upon receiving ConversationUpdate activity
     * 2. Use LUIS to recognize intents for incoming user message
     * 3. Start a greeting dialog
     * 4. Optionally handle Cancel or Help interruptions
     *
     * @param {Context} context turn context from the adapter
     */
    async onTurn(context) {
    var setCountFlag = false;
    if (context.activity.type === ActivityTypes.Message) {
        // Perform a call to LUIS to retrieve results for the user's message.
        const results = await this.luisRecognizer.recognize(context);
        console.log("results:", results);

        // Since the LuisRecognizer was configured to include the raw results, get the `topScoringIntent` as specified by LUIS.
        const topIntent = results.luisResult.topScoringIntent;
        console.log("topintent", topIntent);
        switch (topIntent.intent) {
            case 'CountOfCars':
                setCountFlag = true;
                console.log("count flag:", setCountFlag);
                await context.sendActivity(`LUIS Top Scoring Intent: ${topIntent.intent}, Score: ${ topIntent.score }`);
                await context.sendActivity('Entities:');
                results.luisResult.entities.forEach((element) => {
                    context.sendActivity(element.type + '-->' + element.entity);
                });
            case 'SearchForCars':
                setCountFlag = false;
                console.log("count flag:", setCountFlag);
                await context.sendActivity(`LUIS Top Scoring Intent: ${topIntent.intent}, Score: ${ topIntent.score }`);
                await context.sendActivity('Entities:');
                results.luisResult.entities.forEach((element) => {
                    context.sendActivity(element.type + '-->' + element.entity);
                });
                var entityDetails = '';
                Object.keys(results.entities).forEach(function (prop) {
                    var luisEntity = results.entities[prop];
                    if (prop != '$instance') {
                        entityDetails = entityDetails + prop + '-' + luisEntity[0] + ',';
                    }
                });
                if (entityDetails != '') {
                    entityDetails = entityDetails.substr(0, entityDetails.length - 1);
                }

                var entityValues = [];

                if (entityDetails != '')
                    entityValues = entityDetails.split(',');
                var sb = new StringBuilder();
                var carsQuery = 'SELECT knr , Aggregate, seats, color FROM [dbo].[vehicles] ';
                sb.append(carsQuery);
                if (entityValues != null && entityValues.length > 0) {
                    sb.append(' WHERE ');
                    for (var i = 0; i < entityValues.length; ++i) {
                        var entityType = entityValues[i].substr(0, entityValues[i].indexOf('-')).trim();
                        var dbColumn = mapping[entityType];
                        sb.append(dbColumn + ' = \'' + entityValues[i].substr(entityValues[i].indexOf('-') + 1) + '\'');
                        if (i < entityValues.length - 1)
                            sb.append(' AND ');
                    }
                }
                var selectQuery = sb.toString();
                console.log(selectQuery);
                //
                var result = "";
                result = await conn.getVehicles(selectQuery);
                await context.sendActivity(`Result : ${result}`);
            case 'None':
                setCountFlag = false;
                console.log("count flag:", setCountFlag);
                //If the top scoring intent was "None" tell the user no valid intents were found and provide help.
                await context.sendActivity(`No LUIS intents were found.
                                                \nThis sample is about identifying two user intents:
                                                \n - 'Calendar.Add'
                                                \n - 'Calendar.Find'
                                                \nTry typing 'Add Event' or 'Show me tomorrow'.`);
        }
    } else if (context.activity.type === ActivityTypes.ConversationUpdate &&
        context.activity.recipient.id !== context.activity.membersAdded[0].id) {
        // If the Activity is a ConversationUpdate, send a greeting message to the user.
        //await context.sendActivity('Welcome to the LUIS Demo sample! Send me a message and I will try to predict your intent.');
    } else if (context.activity.type !== ActivityTypes.ConversationUpdate) {
        // Respond to all other Activity types.
        await context.sendActivity(`[${ context.activity.type }]-type activity detected.`);
    }
}
}

module.exports.BasicBot = BasicBot;
