import TelegramBot from 'node-telegram-bot-api'
import { exec } from 'child_process'
import axios from 'axios';
import dotenv from 'dotenv'
import { readdir, stat, readFile } from 'fs'

dotenv.config()

const token = process.env.TELEGRAM_TOKEN
  ? process.env.TELEGRAM_TOKEN
  : console.error(`TELEGRAM_TOKEN must be defined in the .env-file`)
const exec_pass = process.env.EXEC_PASS
  ? process.env.EXEC_PASS
  : console.error(`EXEC_PASS must be defined in the .env-file`)

let chatId
const adviceUrl = 'http://fucking-great-advice.ru/api/random';

/* Create a bot instance */
const bot = new TelegramBot(token, { polling: true })

const menu = {
  reply_markup: {
    keyboard: [
      [
        { text: 'Apps status && git branch' },
        { text: 'restart frontend' },
        { text: 'WTF?' },
      ],
      [
        { text: 'Check free space' },
        // { text: 'git status' },
        { text: 'Run command' },
        { text: 'Get advice' },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Wellcome to svam-front server monitoring bot!', menu)
  chatId = msg.chat.id
})

bot.onText(/Apps status && git branch/, (msg) => {
  exec(
    `pm2 jlist | jq -r '.[] | [
      .pm_id, .name, 
      .pm2_env.status, 
      ((.pm2_env.pm_uptime + 3 * 3600000)/1000 | strftime("%H:%M:%S"))
    ] | @tsv' &&
    cd /home/waadmin/svam_front &&
    git status`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      const chatId = msg.chat.id
      bot.sendMessage(chatId, `<pre>${stdout}</pre>`, { parse_mode: 'HTML' })
    }
  )
})

bot.onText(/restart frontend/, (msg) => {
  exec('pm2 restart frontend_swam', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    const chatId = msg.chat.id
    bot.sendMessage(chatId, `<pre>${stdout}</pre>`, { parse_mode: 'HTML' })
  })
})

bot.onText(/WTF?/, (msg) => {
  exec('tail -n 50 $HOME/nohup.out', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }

    // Заменяем все символы тегов на подчеркивание
    const cleanedOutput = stdout.replace(/<[^>]+>/g, '_')

    const chatId = msg.chat.id
    bot.sendMessage(chatId, `<pre>${cleanedOutput}</pre>`, { parse_mode: 'HTML' })
  })
})

bot.onText(/Check free space/, (msg) => {
  exec(
    'df -h --output=source,size,used,avail /dev/vda2',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      const chatId = msg.chat.id
      bot.sendMessage(chatId, `<pre>${stdout}</pre>`, { parse_mode: 'HTML' })
    }
  )
})

bot.onText(/Get advice/, async (msg) => {
  const chatId = msg.chat.id
  await axios
      .get(adviceUrl)
      .then((response) => {
        const advice = response.data.text;
        bot.sendMessage(chatId, advice);
      })
      .catch((error) => {
        console.error(error);
        bot.sendMessage(chatId, 'Advices are not available right now');
      });
})

/* bot.onText(/git status/, (msg) => {
  exec(
    `cd ~/web_server &\ 
      pwd $\ 
      git pull origin main`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      const chatId = msg.chat.id
      bot.sendMessage(chatId, `<pre>${stdout}</pre>`, { parse_mode: 'HTML' })
    }
  )
}) */

bot.onText(/Run command/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Enter PIN:', {
    reply_to_message_id: msg.message_id,
  })

  /* Create a check PIN handler */
  const passHandler = (msg) => {
    /* Check if sent message is from the initial user */
    if (msg.chat.id === chatId) {
      /* Get PIN from user */
      const pass = msg.text
      /* Remove message with entered PIN from chat history */
      bot.deleteMessage(chatId, msg.message_id)
      /* Check if entered PIN correct */
      if (pass === exec_pass) {
        /* Remove check PIN handler listener */
        bot.removeListener('message', passHandler)
        /* Request free linux-command from user */
        bot.sendMessage(chatId, 'Введите команду:')
        /* Create exec command handler */
        const commandHandler = (msg) => {
          /* Check if sent message is from the initial user */
          if (msg.chat.id === chatId) {
            /* Get command from user */
            const command = msg.text
            if (command === '0') {
              /* Remove exec command handler when "0" has been typed */
              bot.removeListener('message', commandHandler)
              /* Remove check PIN handler */
              bot.removeListener('message', passHandler)
              /* Remove "command execution exit mode"- handler listener */
              bot.removeListener('message', exitHandler)
            } else {
              /* Execute command and send stdout to the user */
              exec(`cd .. && ${command}`, (error, stdout, stderr) => {
                if (error) {
                  console.error(`exec error: ${error}`)
                  bot.sendMessage(chatId, `<pre>${stderr}</pre>`, {
                    parse_mode: 'HTML',
                  })
                  return
                }
                bot
                  .sendMessage(chatId, `<pre>${stdout}</pre>`, {
                    parse_mode: 'HTML',
                  })
                  .then(() => {
                    bot.sendMessage(
                      chatId,
                      'Введите следующую команду (или "0" для выхода):'
                    )
                  })
                  .catch((error) => {
                    console.log(error)
                  })
              })
            }
          }
        }

        /* Listen messages from user for execution */
        bot.on('message', commandHandler)
      } else {
        bot.sendMessage(chatId, 'Неправильный PIN-код: повторите попытку или введите "0" для выхода...')
      }
    }
  }

  /* Create "PIN processing exit mode"- handler */
  const exitHandler = (msg) => {
    /* Check if sent message is from the initial user */
    if (msg.chat.id === chatId && msg.text === '0') {
      /* Remove check PIN handler listener */
      bot.removeListener('message', passHandler)
      /* Remove "command execution exit mode"- handler listener */
      bot.removeListener('message', exitHandler)
      // отправляем сообщение об успешном выходе из режима ввода кодового слова
      bot.sendMessage(
        chatId,
        'Успешный выход из режима ввода команд'
      )
    }
  }

  /* Listen messages for PIN check */
  bot.on('message', passHandler)
  /* Listen messages for exit from the PIN-check mode */
  bot.on('message', exitHandler)
})

/* Set the path to the directory containing the log files to monitor */
const logDir = process.env.LOG_FOLDER_PATH
const filePathToMonitor = `${logDir}/status.log`

let lastModified = 0

const interval = 5000

function checkLogs() {
  stat(filePathToMonitor, (err, stats) => {
    if (err) {
      console.error(`Error getting file stats: ${err}`)
      return
    }

    /* get the current last modified time of the file */
    const currentModified = stats.mtimeMs

    /* check if the file was modified since the last check */
    if (lastModified !== 0 && lastModified !== currentModified) {
      /* if the file was modified, read the new content and send a message */
      readFile(filePathToMonitor, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file: ${err}`)
          return
        }

        /* get the new content added to the file */
        const newData = data.split('\n').slice(-2).join('\n')

        if (newData.includes('svam_front') || newData.includes('svam_admin')) {
          /* send the new content as a message */
          bot.sendMessage(205813238, `Swam frontend status changed:\n${newData}`)
        }
      })
    }

    /* update the last modified time for the file */
    lastModified = currentModified
  })
}

/* start checking the log files at the specified interval */
setInterval(checkLogs, interval)
