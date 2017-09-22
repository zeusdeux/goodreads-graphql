import fetch from 'node-fetch'
import util from 'util'
import xml2js from 'xml2js'
import graphql from 'graphql'
import {goodreads} from './config.mjs'

const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = graphql

const {key} = goodreads
const parseXML = util.promisify(xml2js.parseString)


const fetchGR = (endpoint, q = '') => {
  return fetch(`https://www.goodreads.com/${endpoint}?${q}${q.length ? '&' : ''}key=${key}`)
    .then(r => r.text())
    .then(parseXML)
    .then(r => {
      const { error, GoodreadsResponse } = r
      if (error) {
        return Promise.reject(new Error(error))
      }

      return GoodreadsResponse
    })
}
const getAuthorById = id => {
  return fetchGR('author/show.xml', `id=${id}`)
    .then(r => r.author[0])
}

const getAuthorByName = name => {
  const authorName = encodeURIComponent(name)

  return fetchGR(`api/author_url/${authorName}`)
    .then(r => {
      try {
        return r.author[0]['$'].id
      } catch (_) {
        return Promise.reject(new Error('author not found'))
      }
    })
    .then(getAuthorById)
}

const BookType = new GraphQLObjectType({
  name: 'Books',
  description: 'Books by author',
  fields: _ => ({
    title: {
      type: GraphQLString,
      description: 'Book title',
      resolve: books => books.title
    },
    isbn: {
      type: GraphQLString,
      description: 'Book isbn number',
      resolve: books => books.isbn
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

export default new GraphQLSchema({
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
        resolve: (root, { id, name }) => {
          const hasName = !!name
          const hasId = typeof id === 'number'

          if (hasName && hasId) {
            return Promise.reject(new Error('Provide either author name or author id, not both'))
          }
          if (hasName) {
            return getAuthorByName(name)
          }
          if (hasId) {
            return getAuthorById(id)
          }

          return Promise.reject(new Error('Author id or name argument must be provided'))
        }
      }
    })
  })
})
