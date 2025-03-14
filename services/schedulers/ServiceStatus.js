/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const cron = require("node-cron");
const trigger = require("#config/cron.json").ServiceStatus.cron;
const readline = require("readline");
const os = require("os");

// Create a readline interface to control the console output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to update the status footer
function updateFooter(processStats, systemStats) {
  readline.cursorTo(process.stdout, 0, process.stdout.rows - 2);
  readline.clearLine(process.stdout, 0);
  process.stdout.write(`Process: ${processStats.uptime}s | ${processStats.memory}MB | ${processStats.cpu}%\n`);
  readline.cursorTo(process.stdout, 0, process.stdout.rows - 1);
  readline.clearLine(process.stdout, 0);
  process.stdout.write(`System: ${systemStats.uptime}s | ${systemStats.memory} | ${systemStats.cpu}%`);
}

// Function to get CPU usage
function getCpuUsage() {
  const cpus = os.cpus();
  let user = 0;
  let nice = 0;
  let sys = 0;
  let idle = 0;
  let irq = 0;
  for (let cpu of cpus) {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  }
  const total = user + nice + sys + idle + irq;
  return (((total - idle) / total) * 100).toFixed(2);
}

// Function to get system uptime
function getSystemUptime() {
  return os.uptime().toFixed(0);
}

// Function to get system memory usage
function getSystemMemoryUsage() {
  const totalMemory = os.totalmem() / 1024 / 1024;
  const freeMemory = os.freemem() / 1024 / 1024;
  const size = totalMemory - freeMemory;
  const percentage = ((size / totalMemory) * 100).toFixed(2);
  return { size: size.toFixed(2), percentage };
}

// Report process stats
cron.schedule(trigger, async () => {
  const processMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const processCpu = getCpuUsage();
  const processUptime = process.uptime().toFixed(0);

  const { size, percentage } = getSystemMemoryUsage();
  const systemCpu = getCpuUsage();
  const systemUptime = getSystemUptime();

  updateFooter({ memory: processMemory, cpu: processCpu, uptime: processUptime }, { memory: `${size}MB, ${percentage}%`, cpu: systemCpu, uptime: systemUptime });
});
