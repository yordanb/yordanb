const TMPData = require('./tmpData.json');
const natural = require('natural');
const classifier = new natural.BayesClassifier();

for (let index = 0; index < TMPData.length; index++) {
    const element = TMPData[index];
    classifier.addDocument(`!corona ${element.Location}`, `${element.Location}`);
    
}


classifier.train();

classifier.save('classifier.json', function(err, classifier) {
    // the classifier is saved to the classifier.json file!
});
   