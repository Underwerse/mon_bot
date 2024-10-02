import pm2 from 'pm2'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const LOG_FILE_PATH_TO_MONITOR = process.env.LOG_FILE_PATH_TO_MONITOR
  ? process.env.LOG_FILE_PATH_TO_MONITOR
  : console.error(`LOG_FILE_PATH_TO_MONITOR must be defined in the .env-file`)

// Функция для записи в лог-файл
function logRestart(message) {
  fs.appendFile(LOG_FILE_PATH_TO_MONITOR, message, (err) => {
    if (err) {
      console.error('Ошибка записи в лог файл', err)
    }
  })
}

pm2.connect(function (err) {
  if (err) {
    console.error(err)
    process.exit(2)
  }

  console.log('Подключение к PM2 прошло успешно')

  pm2.launchBus(function (err, bus) {
    if (err) {
      console.error(err)
      return
    }

    console.log(
      `Мониторинг перезапусков запущен, лог-файл ${LOG_FILE_PATH_TO_MONITOR}`
    )

    // Подписка на все события PM2
    bus.on('process:event', (packet) => {
      const event = packet.event
      const processName = packet.process.name || packet.process.pm_id

      logRestart(`С процессом ${processName} произошло событие ${event} ${new Date().toISOString()}\n`)
    })
  })
})
