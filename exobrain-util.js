; (async () => {
  const dayjs = require('dayjs')
  const commander = require('commander')
  const { getDailyTrackingRecord, createDailyTrackingRecord } = require("./service/DailyTrackingService")
  const { getReviewsRecord, createReviewRecord } = require("./service/ReviewsService")
  const { relateChildToParent } = require('./service/NotionService');
  const { createLogger, format, transports } = require('winston');
  const { combine, timestamp, prettyPrint, splat, simple } = format;

  const logger = createLogger({
    format: combine(
      timestamp(),
      prettyPrint(),
      splat(),
      simple()
    ),
    transports: [new transports.Console()]
  })

  const program = new commander.Command()

  const parseDate = (value, dummyPrevious) => {
    const date = dayjs(value, 'YYYY-MM-DD')
    if (!date.isValid()) {
      throw new commander.InvalidArgumentError('Not a valid date')
    }

    return date
  }

  const handleDailyCommand = async (date, options) => {
    options = {...options, ...program.optsWithGlobals()}

    const promises = []

    promises.push(getDailyTrackingRecord(options.notionSecret, options.dailyTrackingId, date))

    promises.push(getReviewsRecord(options.notionSecret, options.reviewsId, 'weekly', date))

    let [currentDailyTracking, currentWeeklyReview] = await Promise.all(promises)

    if (!currentWeeklyReview && options.review) {
      logger.log('info', 'Weekly Review Record not found. Creating a new one.')
      currentWeeklyReview = await createReviewRecord(options.notionSecret, options.reviewsId, 'week', date)
      logger.log('info', 'Weekly Review Record created. ID: %s', currentWeeklyReview.id)
    } else if (currentWeeklyReview && options.review) {
      logger.log('info', 'Weekly Review Record found. ID: %s', currentWeeklyReview.id)
    }

    if (currentDailyTracking) {
      logger.log('info', 'Daily Tracking Record already exists. ID: %s', currentDailyTracking.id)
    } else {
      logger.log('info', 'Creating Daily Tracking Record.')
      currentDailyTracking = await createDailyTrackingRecord(options.notionSecret, options.dailyTrackingId, date, currentWeeklyReview.id)
      logger.log('info', 'Daily Tracking Record created. ID: %s', currentDailyTracking.id)
    }
  }

  const handleReviewCommand = async (date, options) => {
    options = {...options, ...program.optsWithGlobals()}
    
    const promises = [], results = {}

    options.type.forEach(async t => {
      promises.push(getReviewsRecord(options.notionSecret, options.reviewsId, t, date)
        .then(currentReview => {
          if (currentReview && options.type.includes(t)) {
            logger.log('info', '%s Review Record already exists. ID: %s', t.charAt(0).toUpperCase() + t.slice(1), currentReview.id)
            // results[t] = currentReview
            return Promise.resolve(currentReview)
          } else {
            logger.log('info', '%s Review Record not found. Creating a new one.', t.charAt(0).toUpperCase() + t.slice(1))
            return createReviewRecord(options.notionSecret, options.reviewsId, t.replace('ly',''), date)
          }
        }))
    })

    return Promise.all(promises)
    .then(responses => {
      const childPromises = []
      options.type.forEach((t, i) => {
        results[t] = responses[i]
        logger.log('info', '%s Review Record. ID: %s', t.charAt(0).toUpperCase() + t.slice(1), responses[i].id)
      })

      if (results.weekly && results.monthly) {
        childPromises.push(relateChildToParent(options.notionSecret, results.weekly.id, results.monthly.id, 'Parent Reviews'))
      }
      if (results.monthly && results.quarterly) {
        childPromises.push(relateChildToParent(options.notionSecret, results.monthly.id, results.quarterly.id, 'Parent Reviews'))
      }

      return Promise.all(childPromises)
    })
  }

  program
    .name('exobrain-util')
    .description('CLI to help automate aspects of my exobrain in Notion')
    .version('0.1.0')
    .addOption(
      new commander.Option(
        '-n, --notion-secret <secret-value>',
        'Required: Notion integration secret'
      ).env('NOTION_SECRET').makeOptionMandatory())
    .addOption(
      new commander.Option(
        '--reviews-id <Reviews DB ID>',
        'Required: The Notion database id of the Reviews database'
      ).env('REVIEWS_DB_ID').makeOptionMandatory())
    .addOption(
      new commander.Option(
        '--daily-tracking-id <Daily Tracking DB ID>',
        'Required: The Notion database id of the Daily Tracking database'
      ).env('DAILY_TRACKING_DB_ID').makeOptionMandatory())

  program.command('daily')
    .description('Create a new record in Daily Tracking')
    .argument('[date]', 'Date string formatted as YYYY-MM-DD', parseDate, dayjs())
    .option('--no-review', 'Skip connecting weekly review to new Daily Tracking Record')
    .action(handleDailyCommand)

  program.command('review')
    .description('Create a weekly, monthly, and quarterly review if they do not exist')
    .argument('[date]', 'Date string formatted as YYYY-MM-DD', parseDate, dayjs())
    .addOption(new commander.Option('-t, --type [type...]', 'The type of Review to create').choices(['weekly', 'monthly', 'quarterly']).default(['weekly', 'monthly', 'quarterly']))
    .action(handleReviewCommand)

  program.parseAsync()

})();