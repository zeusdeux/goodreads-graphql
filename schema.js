let MOTD = 'AYYYYY'

const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')


const BookType = new GraphQLObjectType({
  name: 'Books',
  description: 'Books by author',
  fields: _ => ({
    title: {
      type: GraphQLString,
      description: 'Book title'
    },
    isbn: {
      type: GraphQLString,
      description: 'Book isbn number'
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: 'Author details',
  fields: _ => ({
    name: {
      type: GraphQLString,
      description: 'Author name',
      resolve: parsedXml => parsedXml.name[0]
    },
    books: {
      type: new GraphQLList(BookType),
      description: 'List of books by author',
      args: {
        title: { type: GraphQLString, description: 'Book title to search for. It is case insensitive and support regex.' }
      },
      resolve: (parsedXml, { title: titleArg }) => {
        const booksList = parsedXml.books[0].book.map(({title: [title], isbn: [isbn]}) => ({title, isbn}))

        if (titleArg) {
          const argAsRegex = new RegExp(titleArg, 'i') // TODO: sanitize user input i.e., titleArg

          return booksList.filter(({title}) => argAsRegex.test(title))
        }

        return booksList
      }
    }
  })
})

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    description: 'Goodreads API exposed via graphql',

    fields: _ => ({
      author: {
        type: AuthorType,
        description: 'Author of a book. Supports search by id or author name',
        args: {
          id: { type: GraphQLInt, description: 'Author id to search for' },
          name: { type: GraphQLString, description: 'Author name to search for' }
        },
        resolve: (root, { id, name }, {loaders: {getAuthorByNameLoader, getAuthorByIdLoader}}) => {
          const hasName = !!name
          const hasId = typeof id === 'number'

          if (hasName && hasId) {
            return Promise.reject(new Error('Provide either author name or author id, not both'))
          }
          if (hasName) {
            return getAuthorByNameLoader.load(name)
          }
          if (hasId) {
            return getAuthorByIdLoader.load(id)
          }

          return Promise.reject(new Error('Author id or name argument must be provided'))
        }
      },
      motd: {
        type: GraphQLString,
        description: 'Message of the day!',
        resolve: _ => MOTD
      }
    })
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    description: 'Update MOTD using mutations',

    fields: _ => ({
      setMotd: {
        name: 'setMotd',
        description: 'set the message of the day!',
        type: GraphQLString,

        args: {
          msg: { type: GraphQLString, description: 'New message of the day' }
        },
        resolve(_, {msg}) {
          if (!msg) throw new Error('msg argument must be provided')
          MOTD = msg
          return MOTD
        }
      }
    })
  })
})
