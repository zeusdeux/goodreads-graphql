const fetch = require('node-fetch')
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString)
const {goodreads:{key}} = require('./config')

const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')


const getAuthor = id => fetch(`https://www.goodreads.com/author/show.xml?id=${id}&key=${key}`)
      .then(r => r.text())
      .then(parseXML)
      .then(r => r.GoodreadsResponse.author[0])

const BookType = new GraphQLObjectType({
  name: 'Books',
  description: 'Books by author',
  fields: _ => ({
    title: {
      type: GraphQLString,
      resolve: books => books.title
    },
    isbn: {
      type: GraphQLString,
      resolve: books => books.isbn
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: 'Author name',
  fields: _ => ({
    name: {
      type: GraphQLString,
      resolve: parsedXml => parsedXml.name[0]
    },
    books: {
      type: new GraphQLList(BookType),
      args: {
        title: { type: GraphQLString }
      },
      resolve: (parsedXml, { title: titleArg }) => {
        const booksList = parsedXml
              .books[0]
              .book
              .map(({title: [title], isbn: [isbn]}) => ({title, isbn}))

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
        args: {
          id: { type: GraphQLInt }
        },
        resolve: (root, { id }) => getAuthor(id)
      }
    })
  })
})
