# Instructions to import bot on portal.azure.com/ luis on luis.api

1. Create bot with luis option in portal.azure.com
2. Go to luis, import json for luis from github (eg luisdemokiran-bbca.json). Change name, version. Publish.
3. Go to bot on azure and upload additional files needed from github repo e.g. .bot file, .js, mapping.json, resources folder etc
4. Run npm install on bot console in azure
5. Check output on bot in azure and ensure there are no errors.
6. Run the bot

# Prerequisite to run this bot locally
- Download the bot code from the Build blade in the Azure Portal
- Create a file called .env in the root of the project and add the botFilePath and botFileSecret to it
  - You can find the botFilePath and botFileSecret in the Azure App Service application settings
  - Your .env file should look like this
    ```bash
    botFilePath=<copy value from App settings>
    botFileSecret=<copy value from App settings>
    ```

- Run `npm install` in the root of the bot project
- Finally run `npm start` 


## Testing the bot using Bot Framework Emulator
[Microsoft Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator from [here](https://aka.ms/botframework-emulator)

### Connect to bot using Bot Framework Emulator v4
- Launch the Bot Framework Emulator
- File -> Open bot and navigate to the bot project folder
- Select `<your-bot-name>.bot` file

## Deploy this bot to Azure
See [here](./deploymentScripts/DEPLOY.md) to learn more about deploying this bot to Azure and using the CLI tools to build the LUIS models this bot depends on.

### Configuring the bot

Update `.env` with the appropriate keys botFilePath and botFileSecret. 
  - For Azure Bot Service bots, you can find the botFileSecret under application settings. 
  - If you use [MSBot CLI](https://github.com/microsoft/botbuilder-tools) to encrypt your bot file, the botFileSecret will be written out to the console window. 
  - If you used [Bot Framework Emulator **V4**](https://github.com/microsoft/botframework-emulator) to encrypt your bot file, the secret key will be available in bot settings. 

### Running the bot

```
node ./index.js
```
### Developing the bot

```
nodemon ./index.js
```



