const dayjs = require('dayjs')
const { queryDatabase, createPage } = require('./NotionService')

dayjs.extend(require('dayjs/plugin/quarterOfYear'))

const getReviewSettings = (date, type) => {
  let beginDate, endDate, title, icon

  switch (type) {
    case 'week':
      beginDate = date.startOf('week')
      endDate = date.endOf('week')

      if (beginDate.year() !== endDate.year()) {
        title = `${beginDate.format('MMMM')} ${beginDate.format('DD')} '${beginDate.format('YY')} - ${endDate.format('MMMM')} ${endDate.format('DD')} '${endDate.format('YY')}`
      } else if (beginDate.month() !== endDate.month()) {
        title = `${beginDate.format('MMMM')} ${beginDate.format('DD')} - ${endDate.format('MMMM')} ${endDate.format('DD')} '${beginDate.format('YY')}`
      } else {
        title = `${beginDate.format('MMMM')} ${beginDate.format('DD')} - ${endDate.format('DD')} '${beginDate.format('YY')}`
      }

      icon = "🗓️"
      break

    case 'month':
      beginDate = date.startOf('month')
      endDate = date.endOf('month')
      title = `${beginDate.format('MMMM')} '${beginDate.format('YY')}`
      icon = "⏳"
      break

    case 'quarter':
      beginDate = date.startOf('quarter')
      endDate = date.endOf('quarter')
      title = `Q${date.quarter()} '${beginDate.format('YY')}`
      icon = "🌎"
      break
  
    default:
      console.log(type)
      throw new Error('type is not one of: weekly, monthly, quarterly')
  }

  return {
    beginDate,
    endDate,
    title,
    icon
  }
}

exports.getReviewsRecord = async (notionSecret, reviewsId, type, date) => {
  return queryDatabase(notionSecret, reviewsId, {
    and: [
      {
        property: 'Type',
        select: {
          equals: type.charAt(0).toUpperCase() + type.slice(1).replace('ly', '')
        }
      },
      {
        property: 'Date Range',
        date: {
          on_or_after: date.startOf(type.replace('ly', '')).format('YYYY-MM-DD')
        }
      },
      {
        property: 'Date Range',
        date: {
          on_or_before: date.endOf(type.replace('ly', '')).format('YYYY-MM-DD')
        }
      }
    ]
  })
  .then(results => {
    return results && results.length === 1 ? results[0] : null
  })
}

exports.createReviewRecord = async (notionsSecret, reviewsId, type, date) => {
  const settings = getReviewSettings(date, type)

  const pageObject = {
    emoji: settings.icon,
    properties: {
      Name: {
        title: [
          {
            type: 'text',
            text: {
              content: settings.title
            }
          }
        ]
      },
      Type: {
        select: {
          name: type.charAt(0).toUpperCase() + type.slice(1)
        }
      },
      'Date Range': {
        date: {
          start: settings.beginDate.format('YYYY-MM-DD'),
          end: settings.endDate.format('YYYY-MM-DD')
        }
      }
    }
  }

  return createPage(notionsSecret, pageObject, reviewsId)
}

// async function createReview(type, childReviewId, parentReviewId, databaseId, client, date) {
//   let beginDate, endDate, title, icon, childReviewObject, parentReviewObject
//   if (type === "Week") {
//     beginDate = date.startOf('week').minus({ days: 1 })
//     endDate = date.endOf('week').minus({ days: 1 })
//     title = `${date.monthLong} ${beginDate.day}-${endDate.day} '${beginDate.year.toString().substring(2)}`
//     icon = "🗓️"
//   } else if (type === "Month") {
//     beginDate = date.startOf('month')
//     endDate = date.endOf('month')
//     title = `${beginDate.monthLong} '${beginDate.year.toString().substring(2)}`
//     icon = "⏳"
//   } else if (type === "Quarter") {
//     beginDate = date.startOf('quarter')
//     endDate = date.endOf('quarter')
//     title = `Q${date.quarter} '${beginDate.year.toString().substring(2)}`
//     icon = "🌎"
//   }
//   // console.log(date.toString(), type, beginDate.toString(), endDate.toString())

//   if (childReviewId) {
//     childReviewObject = {
//       relation: [{ id: childReviewId }]
//     }
//   }
//   if (parentReviewId) {
//     parentReviewObject = {
//       relation: [{ id: parentReviewId }]
//     }
//   }

//   let response = await client.pages.create({
//     icon: {
//       type: "emoji",
//       emoji: icon
//     },
//     parent: {
//       type: "database_id",
//       database_id: databaseId
//     },
//     properties: {
//       Name: {
//         title: [
//           {
//             type: "text",
//             text: {
//               content: title
//             }
//           }
//         ]
//       },
//       Type: {
//         select: {
//           name: type
//         }
//       },
//       "Date Range": {
//         date: {
//           start: beginDate.toISODate(),
//           end: endDate.toISODate()
//         }
//       },
//       "Child Reviews": childReviewObject,
//       "Parent Reviews": parentReviewObject
//     }
//   })

//   return response
// }

// async function getCurrentReview(type, databaseId, client, date) {
//   const response = await client.databases.query({
//     database_id: databaseId,
//     filter: {
//       and: [
//         {
//           property: "Type",
//           select: {
//             equals: type
//           }
//         },
//         {
//           property: "Date Range",
//           date: {
//             on_or_before: date
//           }
//         },
//         {
//           property: "Date Range",
//           date: {
//             on_or_after: date
//           }
//         }
//       ]
//     }
//   })
//   console.log(type, response.results.length)
//   return response
// }

// async function checkAndCreateReviews(databaseId, client, date) {
//   let currentWeekReview, currentMonthReview, currentQuarterReview

//   while (!currentWeekReview || !currentMonthReview || !currentQuarterReview) {
//     weekReviewResponse = await getCurrentReview('Week', databaseId, client, date)
//     currentWeekReview = weekReviewResponse.results[0]

//     monthReviewResponse = await getCurrentReview('Month', databaseId, client, date)
//     currentMonthReview = monthReviewResponse.results[0]

//     quarterReviewResponse = await getCurrentReview('Quarter', databaseId, client, date)
//     currentQuarterReview = quarterReviewResponse.results[0]

//     if (!currentWeekReview) {
//       if (currentMonthReview) {
//         currentMonthReviewId = currentMonthReview.id
//       } else {
//         currentMonthReviewId = null
//       }
//       currentWeekReview = await createReview('Week', null, currentMonthReviewId, databaseId, client, date)
//     }
//     if (!currentMonthReview) {
//       if (currentWeekReview) {
//         currentWeekReviewId = currentWeekReview.id
//       } else {
//         currentWeekReviewId = null
//       }

//       if (currentQuarterReview) {
//         currentQuarterReviewId = currentQuarterReview.id
//       } else {
//         currentQuarterReviewId = null
//       }
//       currentMonthReview = await createReview('Month', currentWeekReviewId, currentQuarterReviewId, databaseId, client, date)
//     }
//     if (!currentQuarterReview) {
//       if (currentMonthReview) {
//         currentMonthReviewId = currentMonthReview.id
//       } else {
//         currentMonthReviewId = null
//       }
//       currentQuarterReview = await createReview('Quarter', currentMonthReviewId, null, databaseId, client, date)
//     }
//   }
// }

// module.exports = { checkAndCreateReviews }