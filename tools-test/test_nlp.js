var natural = require('natural');
var classifier = new natural.BayesClassifier();

natural.BayesClassifier.load('classifier_7.json', null, function(err, classifiers) {
    console.log(classifiers.getClassifications('indonesia'));
    // console.log(classifier.classify('xxxxx'));
});