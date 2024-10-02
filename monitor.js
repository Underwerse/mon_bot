import pm2 from 'pm2';
import fs from 'fs';
const logFilePath = `~/logs/status.log`;

// Функция для записи в лог-файл
function logRestart(processName) {
  const message = `Процесс PM2 с именем ${processName} перезапустился - ${new Date().toISOString()}\n`;
  fs.appendFile(logFilePath, message, (err) => {
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

    bus.on('process:event', function(data) {
      if (data.event === 'restart') {
        // Логируем перезапуск процесса
        logRestart(data.process.name);
      }
    });
  });
});
