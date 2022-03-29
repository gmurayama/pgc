export function log(message) {
  const date = new Date();
  const hours = formatTime(date.getHours());
  const minutes = formatTime(date.getMinutes());
  const seconds = formatTime(date.getSeconds());
  const milliseconds = formatMilliseconds(date.getMilliseconds());
  console.log(`[${hours}:${minutes}:${seconds}.${milliseconds}] ${message}`);
}

function formatTime(time: number) {
  if (time < 10) {
    return `0${time}`;
  }

  return String(time);
}

function formatMilliseconds(time: number) {
  if (time < 10) {
    return `00${time}`;
  }

  if (time < 100) {
    return `0${time}`;
  }

  return String(time);
}