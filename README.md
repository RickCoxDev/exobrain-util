# exobrain-util

This project is a command line utility to help automate parts of my second brain (exobrain) in Notion.

## Usage
The CLI requires a Notion integration secret to connect to Notion through the API. You can create one [here](https://www.notion.so/my-integrations).

`node exobrain-util.js [options] [command]`

```bash
Usage: exobrain-util [options] [command]

CLI to help automate aspects of my exobrain in Notion

Options:
  -V, --version                               output the version number
  -n, --notion-secret <secret-value>          Required: Notion integration secret (env: NOTION_SECRET)
  --reviews-id <Reviews DB ID>                Required: The Notion database id of the Reviews database (env: REVIEWS_DB_ID)
  --daily-tracking-id <Daily Tracking DB ID>  Required: The Notion database id of the Daily Tracking database (env: DAILY_TRACKING_DB_ID)
  -h, --help                                  display help for command

Commands:
  daily [options] [date]                      Create a new record in Daily Tracking
  review [options] [date]                     Create a weekly, monthly, and quarterly review if they do not exist
  help [command]                              display help for command
```

## Available Actions
Currently there are two available commands: `daily` and `review`.
Both of these commands will not create new records if it finds that one already exists.

### Daily Command
The `daily` command takes a date argument and creates a record in the Daily Tracking Notion Database. After the new record is created or an existing one is found for the given date It connects it to the appropriate Weekly Review record. If a Weekly Review record is not found one is created.

```bash
Usage: exobrain-util daily [options] [date]

Create a new record in Daily Tracking

Arguments:
  date         Date string formatted as YYYY-MM-DD (default: "2023-02-06T17:37:13.955Z")

Options:
  --no-review  Skip connecting weekly review to new Daily Tracking Record
  -h, --help   display help for command
```

### Review Command
The `review` command sets up the hierarchy of Reviews in my Notion workspace. There are three different types: `weekly`, `monthly`, and `quarterly`. This command creates Review records of the type you specify unless one is already found. It then connects them together as `weekly->monthly->quarterly`. If you need to connect two records together ie. weekly and monthly, but they already exists run: `node exobrain-util.js review [date] -t weekly monthly` and it will find these two records and connect them.

```bash
Usage: exobrain-util review [options] [date]

Create a weekly, monthly, and quarterly review if they do not exist

Arguments:
  date                  Date string formatted as YYYY-MM-DD (default: "2023-02-06T17:42:16.931Z")

Options:
  -t, --type [type...]  The type of Review to create (choices: "weekly", "monthly", "quarterly", default: ["weekly","monthly","quarterly"])
  -h, --help            display help for command
```