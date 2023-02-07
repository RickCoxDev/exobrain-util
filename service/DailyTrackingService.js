const { queryDatabase, createPage } = require('./NotionService')

exports.getDailyTrackingRecord = async (notionSecret, dailyTrackingId, date) => {
  return queryDatabase(notionSecret, dailyTrackingId, {
    property: 'Date',
    date: {
      equals: date.format('YYYY-MM-DD')
    }
  })
  .then(results => {
    return  results && results.length === 1 ? results[0] : null
  })
}

exports.createDailyTrackingRecord = async (notionSecret, dailyTrackingId, date, weeklyReviewId) => {
  const pageObject = {
    emoji: '🌻',
    properties: {
      Name: {
        title: [
          {
            type: 'mention',
            mention: {
              type: 'date',
              date: {
                start: date.format('YYYY-MM-DD')
              }
            }
          }
        ]
      },
      Date: {
        date: {
          start: date.format('YYYY-MM-DD')
        }
      }
    }
  }

  if (weeklyReviewId) {
    pageObject.properties.Week = {
      relation: [{id: weeklyReviewId}]
    }
  }

  return createPage(notionSecret, pageObject, dailyTrackingId)
}