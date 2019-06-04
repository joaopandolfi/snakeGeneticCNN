var synaptic = require('synaptic');

var Network = synaptic.Network;
var Architect = synaptic.Architect;

function Perceptron(input, hidden, output){
   //return new Architect.Perceptron(input, hidden, hidden, hidden, hidden, output);
   return new Architect.Perceptron(input, hidden, hidden, output);
   //return new Architect.Perceptron(input, hidden, output);
}
 

function fromJSON(newGenome){
    return Network.fromJSON(newGenome)
}

function toJSON(genome){
    return Network.toJSON(genome)
}

module.exports = {Perceptron: Perceptron, fromJSON: fromJSON, toJSON: toJSON}