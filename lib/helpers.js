const fetch = require('node-fetch');
const tabletojson = require('tabletojson').Tabletojson;
const natural = require('natural');

const getCoronaIndonesia = () => new Promise((resolve, reject) => {
    fetch('https://kawalcovid19.harippe.id/api/summary', {
        method:'GET'
    })
    .then(res => res.json())
    .then(res => {
        resolve(res)
    })
    .catch(err => {
        reject(err)
    });
});

const getAllCorona = () => new Promise((resolve, reject) => {
    fetch('https://google.org/crisisresponse/covid19-map', {
        method:'GET'
    })
    .then(res => res.text())
    .then(res => {
        const allTable = tabletojson.convert(res);
        const tableCovid = allTable[1];
        const newResult = [];
        tableCovid.map(datas => {
            newResult.push({ 
            Location: datas.Location.toLowerCase(),
            'Confirmed cases': datas['Confirmed cases'],
            Recovered: datas.Recovered,
            Deaths: datas.Deaths
            })
        });
        resolve(newResult)
    })
    .catch(err => {
        reject(err)
    });
});

const nlpTest = async (payload) => {
    return new Promise((resolve, reject) => {
        let resultTest = '';
        natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
            if(err) {
                reject({error: true, data: err});
            }
            
            resultTest = classifier.getClassifications(payload);
            resolve({error: false, data: resultTest});
        });
    });
};

module.exports = {
    getCoronaIndonesia,
    getAllCorona,
    nlpTest
}