const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger.json'
const endpointsFiles = ['./server.js']

const doc = {
    info: {
        version: "2.0.3",
        title: "Cosmic Comics Node Server",
        description: "The NodeJS version of the Cosmic Comics server",
    },
    host: "localhost",
    basePath: "/",
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json']
}


swaggerAutogen(outputFile, endpointsFiles, doc)