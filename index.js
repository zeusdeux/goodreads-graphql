const express = require('express')
const graphqlHTTP = require('express-graphql')
const DataLoader = require('dataloader')
const schema = require('./schema')
const {getAuthorByName, getAuthorById} = require('./client')

const app = express()

const port = process.env.PORT || 3000

app.use('/graphql', graphqlHTTP(_req => {
  const getAuthorByIdLoader = new DataLoader(ids => Promise.all(ids.map(getAuthorById)))
  const getAuthorByNameLoader = new DataLoader(names => Promise.all(names.map(getAuthorByName)))
  const loaders = {
    getAuthorByIdLoader,
    getAuthorByNameLoader
  }

  return {
    context: {loaders},
    graphiql: true,
    schema
  }
}))

app.use('/', (_, res) => res.send('hello\n'))

app.listen(port, _ => console.log(`Listening on ${port}`))
