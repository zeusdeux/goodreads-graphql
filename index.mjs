import express from 'express'
import graphqlHTTP from 'express-graphql'
import schema from './schema.mjs'

const app = express()

const port = process.env.PORT || 3000

app.use('/graphql', graphqlHTTP({
  graphiql: true,
  schema
}))
app.use('/', (_, res) => res.send('hello\n'))

app.listen(port, _ => console.log(`Listening on ${port}`))
