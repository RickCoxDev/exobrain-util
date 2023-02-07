const { Client } = require('@notionhq/client')

let notionClient = {}

const getNotionClient = (secret) => {
    if (!(notionClient instanceof Client)) {
        notionClient = new Client({
            auth: secret
        })
    }

    return notionClient
}

exports.queryDatabase = async (notionSecret, databaseId, filter) => {
    const client = getNotionClient(notionSecret)

    const response = await client.databases.query({
        database_id: databaseId,
        filter
    })

    return response.results.length > 0 ? response.results : null
}

exports.createPage = async (notionSecret, pageObject, databaseId) => {
    const client = getNotionClient(notionSecret)

    if (databaseId) {
        pageObject.parent = {
            type: "database_id",
            database_id: databaseId
        }
    }

    const {emoji, ...rest} = pageObject

    return client.pages.create({
        ...rest,
        icon: {
            type: "emoji",
            emoji: emoji
        }
    })
}

exports.relateChildToParent = async (notionSecret, childPageId, parentPageId, propertyName) => {
    const client = getNotionClient(notionSecret)

    const pageObject = {
        page_id: childPageId,
        properties: {}
    }

    pageObject.properties[propertyName] = {
        relation: [{id: parentPageId}]
    }

    return client.pages.update(pageObject)
}