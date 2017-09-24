const fetch = require('node-fetch')
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString)
const {goodreads: {key}} = require('./config')

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

module.exports = {
  getAuthorById,
  getAuthorByName
}
