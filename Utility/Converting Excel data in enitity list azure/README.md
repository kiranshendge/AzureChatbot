# ConvertingExcelDataToAzureEntityFormat

We need a paritcular JSON format while importing the values in an Enitity created on luis.

A demo format is :- 

[
    {
        "canonicalForm": "Egypt",
        "list": []
    },
    {
        "canonicalForm": "USA",
        "list": []
    }
]

list array holds the synonyms.

In the code the schemaClass replicates the above schema.
You will find a List.xlsx file. Just copy paste the values from your original excel sheet to the first column of List.xlsx below column1. DO NOT CHANGE THE HEADER i.e column1

run app.js (i.e node app.js)

You will find that a new file has been created with the name result.JSON.
The format will be like :_ 
{"canonicalForm":1,"list":[]},{"canonicalForm":2,"list":[]},{"canonicalForm":3,"list":[]},{"canonicalForm":4,"list":[]}

Just edit the file and put square bracket at the start and end indicating that it is an array. Final result should be like
[{"canonicalForm":1,"list":[]},{"canonicalForm":2,"list":[]},{"canonicalForm":3,"list":[]},{"canonicalForm":4,"list":[]}]

You are good to upload this JSON file.
Cheers!!!
