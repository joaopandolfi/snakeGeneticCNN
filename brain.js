var learner = require("./learner")

var Brain = {
    currentNeuron: null,
    valueToModule: 0,
    idGene:0,
}

var directions = ['W','N','E','S']

Brain.begin = (callback) =>{
    learner.initialize(true)
    gene = learner.getNextGene()
    Brain.currentNeuron = gene.genome
    Brain.idGene = gene.idGene
    callback()
}

Brain.load = async (callback) =>{
    await learner.loadSavedGenes((success)=>{
        if(!success)
            learner.initialize(true)
        gene = learner.getNextGene()
        Brain.currentNeuron = gene.genome
        Brain.idGene = gene.idGene
        callback()
    })
}

Brain.setMaxValue = (max) =>{
    Brain.valueToModule = max
}

Brain.moduleSensors = (sensors) =>{
    return sensors.map((v)=>{
        return v/Brain.valueToModule
    })
}

Brain.save = () =>{
    learner.saveGenes()
}

Brain.takeDecision = (sensors,direction) =>{
    sensors = Brain.moduleSensors(sensors)
    output = Brain.currentNeuron.activate(sensors)
    //sorted = output.sort(function(a, b){return b - a});
    //decision = sorted.indexOf(sorted[0])
    decision = output[0]
    command = ""
    shift = 0
    if(decision < 0.45){ // Esquerda
        shift = -1
    }else if(decision > 0.55){ // Dureuita
        shift = 1
    }
    pos = directions.indexOf(direction) + shift
    if(pos < 0) pos = 3
    else if(pos == 4) pos = 0
    
   return [directions[pos],[shift,decision,directions[pos],pos,direction],output]
}

Brain.computeLoose = (score)=>{
    learner.setGeneScore(score)
}

Brain.prepareToNextGame = () => {
    gene = learner.getNextGene()
    //gene = learner.bestGene
    Brain.currentNeuron = gene.genome
    Brain.idGene = gene.idGene
}

Brain.tellState = () =>{
    return {
        generation: learner.generation,
        gene: Brain.idGene,
        bestScore: learner.bestScore,
        bestGene: learner.bestGene? {id:learner.bestGene.idGene,score:learner.bestGene.score}: null
    }
}

module.exports = Brain