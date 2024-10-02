import pm2 from 'pm2';
import fs from 'fs';
import dotenv from 'dotenv'

dotenv.config()

const LOG_FILE_PATH_TO_MONITOR = process.env.LOG_FILE_PATH_TO_MONITOR
  ? process.env.LOG_FILE_PATH_TO_MONITOR
  : logger.error(`LOG_FILE_PATH_TO_MONITOR must be defined in the .env-file`)

// Функция для записи в лог-файл
function logRestart(processName) {
  const message = `Процесс PM2 с именем ${processName} перезапустился - ${new Date().toISOString()}\n`;
  fs.appendFile(LOG_FILE_PATH_TO_MONITOR, message, (err) => {
    if (err) {
      console.error('Ошибка записи в лог файл', err);
    }
  });
}

pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(2);
  }

  pm2.launchBus(function(err, bus) {
    if (err) {
      console.error(err);
      return;
    }

    console.log('Мониторинг перезапусков запущен');

    // Обработчик событий перезапуска
    bus.on('process:restart', (packet) => {
      const processName = packet.process.name || packet.process.pm_id;
      logToFile(`Процесс ${processName} перезапущен`);
      console.log(`Процесс ${processName} перезапущен`);
    });
  });
});
