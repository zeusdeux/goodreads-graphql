const express = require('express')
const graphqlHTTP = require('express-graphql')

const app = express()
const schema = require('./schema')

const port = process.env.PORT || 3000

app.use('/graphql', graphqlHTTP({
  graphiql: true,
  schema
}))
app.use('/', (_, res) => res.send('hello\n'))

app.listen(port, _ => console.log(`Listening on ${port}`))
