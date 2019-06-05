var fs = require('fs');
var neural = require("./networks")
var _ = require('lodash');

var Config = {
    sensors:4,
    brainSize:5,
    outputs:1,
    populationSize: 12,
    naturalSelectionTax:0.3,
    naturalPropagation: 1,
    mutationTax: 0.2,
    biasScore:0,
    crossOverType:1, // 0 -> random, 1 -> slice
    getRandon: (min,max) =>{
        return Math.floor(Math.random() * (max - min) + min);
    }
}

var Learner = {
    currentGene:0,
    generation:0,
    bestGene: null,
    bestScore:-100000
}

var Gene = {
    genome:null,
    idGene:0,
    generation:0,
    learned:false,
    bestGene:false,
    score:0
}

var Nature = {
    genes: [],
}

// ----- LEARNER FUNCTIONS -----

Learner.getNextGene = ()=>{
    if(Learner.currentGene >= Config.populationSize-1){
        Learner.currentGene = 0
        Learner.generation++
        Nature.nextGeneration(Learner.generation)
        //console.log("New Generation ",Learner.generation)
        if(Learner.generation%10 == 0){ // Salva a cada 10 iterações
            Learner.saveGenes()
        }
        return Nature.genes[0]
    }else{
        current = Learner.currentGene
        Learner.currentGene++
        Nature.genes[current].idGene = (Learner.generation*Config.populationSize) + Learner.currentGene
        return Nature.genes[current]
    }
}

Learner.setGeneScore = (score) =>{
    Nature.genes[Learner.currentGene].score = score
}

Learner.saveGenes = () =>{
    console.log("Saving Genes")
    data = JSON.stringify({Learner:Learner,Nature:Nature})
    fs.writeFile('stateDump.json', data, (a)=>{}); 
}

Learner.loadSavedGenes = async (callback) =>{
    console.log("LOADING SAVED GENES")
    await fs.readFile('stateDump.json', (err, data) =>{
        if (err){
            console.log(err);
            callback(false)
        } else {
            obj = JSON.parse(data); 
            l =  obj.Learner
            Learner.bestGene = l.bestGene
            Learner.bestGene.genome = neural.fromJSON(l.bestGene.genome)
            Learner.currentGene = l.currentGene
            Learner.generation = l.generation
            Learner.bestScore = l.bestScore
            n = obj.Nature.genes
            n.map((g)=>{
                g.genome = neural.fromJSON(g.genome)
                Nature.genes.push(g)
            })
            callback(true)
    }})
}

Learner.initialize = (random) =>{
    if(random){
        Learner.generation = 0
        Learner.currentGene = 0
        Nature.randomPopulation(0)
    }
}

Learner.setBestGene = (gene) =>{
    gene.bestGene = true
    genome = _.cloneDeep(gene).genome//.toJSON()
    Learner.bestGene = Object.assign({}, gene)
    Learner.bestGene.genome = genome//neural.fromJSON(genome)
    Learner.bestScore = Learner.bestGene.score
}


// ----- NATURE FUNCTIONS -----

// Genetic Algorithm

/* Make next generation */
Nature.nextGeneration = (generation)=>{
    nextGeneration = []
    strongs = Nature.strongSelect(Nature.genes)
    //if(strongs[0].score < 10) return Nature.randomPopulation(generation)

    //let geneSelect = false
    //strongs.map((g)=>{if(g.bestGene) geneSelect=true})

    //if(strongs[0].score > Learner.bestScore+Config.biasScore || (geneSelect && strongs[0].idGene != Learner.bestGene.idGene)) Learner.setBestGene(strongs[0])
    //if(strongs[0].score > Learner.bestScore+Config.biasScore) Learner.setBestGene(strongs[0])
    //else strongs.unshift(Learner.bestGene)
    Learner.setBestGene(strongs[0])
    nextGeneration.push(strongs[0])
    nextGeneration.push(Nature.mutate(_.cloneDeep(Learner.bestGene)))
    nextGeneration = nextGeneration.concat(sorted.slice(0,Math.round(Config.naturalPropagation * strongs.length )))
    
    for (s =0 ; s < strongs.length-1; s++){
        for(l=s+1; l<strongs.length; l++){
            if(nextGeneration.length >= Config.populationSize){
                Nature.genes = nextGeneration
                return nextGeneration
            }else{
                nextGeneration.push(Nature.mutate(Nature.crossOver(strongs[s],strongs[l])))
            }
        }
    }
    for(c = nextGeneration.length; c <= Config.populationSize; c++){
        //nextGeneration.push(Nature.mutate(Nature.crossOver(strongs[0],Nature.newRandomGene(generation,generation+c))))
        nextGeneration.push(Nature.newRandomGene(generation,generation+c))
    }
    Nature.genes = nextGeneration
    return nextGeneration
}

// New Abstract gene
Nature.newGene = (genome,generation,id) =>{
    //let g = _.cloneDeep(Gene)
    let g = Object.assign({}, Gene)
    g.genome = genome
    g.generation = generation
    g.idGene = id
    return g
}

// New Gonome -> Newural netwok inside gene
Nature.newGenome = () => {
    return neural.Perceptron(Config.sensors,Config.brainSize,Config.outputs)
}

// Return Strongest genes
Nature.strongSelect = (genes) => {
    sorted = genes.sort(function(a, b){return b.score - a.score});
    return sorted.slice(0,Math.round(Config.naturalSelectionTax * sorted.length ))
}

Nature.newRandomGene = (idPopulation,idGene) =>{
    let genome = Nature.newGenome().toJSON();
    Nature._mutate(genome.neurons,'bias',1)
    Nature._mutate(genome.connections,'weight',1)
    genome = neural.fromJSON(genome)
    return Nature.newGene(genome,idPopulation,idGene)
}

// Return completly random genes
Nature.randomPopulation = (idPopulation) =>{
    let population = []
    let idGene = (idPopulation * Config.populationSize)
    for (i=0 ; i<Config.populationSize; i++){
        idGene++
        population.push(Nature.newRandomGene(idPopulation, idGene))
    }
    Nature.genes = population
    return population
}


// Hard nature process

// Mutate Gene
Nature.mutate = (gene) =>{
    genome = gene.genome.toJSON()
    Nature._mutate(genome.neurons,'bias',Config.mutationTax)
    Nature._mutate(genome.connections,'wheight',Config.mutationTax)
    gene.genome = neural.fromJSON(genome)
    return gene
}

// Make crossover 
Nature.crossOver = (geneA, geneB) =>{
    geneA = _.cloneDeep(geneA).genome.toJSON()
    geneB = _.cloneDeep(geneB).genome.toJSON()
    if( Math.random() > 0.5) Nature._crossOver(geneA.neurons,geneB.neurons,'bias',Config.crossOverType)
    else Nature._crossOver(geneA.connections,geneB.connections,'wheight',Config.crossOverType)
    if( Math.random() > 0.5) return Nature.newGene(neural.fromJSON(geneA),Learner.generation,Learner.generation)
    return Nature.newGene(neural.fromJSON(geneB),Learner.generation,Learner.generation)
}

// ---- Genome manipulation functions -----

// Mutate Genome
Nature._mutate = (gene,key,probability) =>{
    for (var k = 0; k < gene.length; k++) {
        // verifica probabilidade de mutacao
        if (Math.random() > probability) continue;
        gene[k][key] = gene[k][key] * (Math.random() - 0.5) * 2 + (Math.random() - 0.5);
      }
}

// Cross over Genome
Nature._crossOver = (geneA,geneB,key,type) =>{
    if(type==1){
        var initSlice = Math.round(geneA.length * Math.random());
        var size  = Math.round(geneA.length * Math.random());
        var tmp;
        for (var k = initSlice; k < geneA.length && k < initSlice+size; k++) {
            // Swap genes
            tmp = geneA[k][key];
            geneA[k][key] = geneB[k][key];
            geneB[k][key] = tmp;
        }
    }else{
        //Random -> 50% of chance
        for (var k = 0; k < geneA.length ; k++) {
            // Swap genes
            if( Math.random() > 0.5){
                tmp = geneA[k][key];
                geneA[k][key] = geneB[k][key];
                geneB[k][key] = tmp;
            }
        }
    }
}



module.exports = Learner