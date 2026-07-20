'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const SDK_ROOT = process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Android', 'Sdk');

const EMULATOR = path.join(SDK_ROOT, 'emulator', process.platform === 'win32' ? 'emulator.exe' : 'emulator');
const ADB = path.join(SDK_ROOT, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
const AVD_ROOT = path.join(os.homedir(), '.android', 'avd');
const IMAGE_SYSDIR = path.join('system-images', 'android-37.0', 'google_apis_playstore_ps16k', 'x86_64') + path.sep;
const AVD_NAME = 'jaheez_customer_test';

function ensureFile(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
    fs.writeFileSync(file, text);
  }
}

function ensureAvd() {
  const avdDir = path.join(AVD_ROOT, `${AVD_NAME}.avd`);
  fs.mkdirSync(avdDir, { recursive: true });
  ensureFile(path.join(AVD_ROOT, `${AVD_NAME}.ini`), [
    'avd.ini.encoding=UTF-8',
    `path=${avdDir}`,
    `path.rel=avd\\${AVD_NAME}.avd`,
    'target=android-37.0',
    '',
  ].join('\n'));
  ensureFile(path.join(avdDir, 'config.ini'), [
    `AvdId=${AVD_NAME}`,
    'PlayStore.enabled=true',
    'abi.type=x86_64',
    'avd.ini.displayname=Jaheez Test Device',
    'avd.ini.encoding=UTF-8',
    'disk.dataPartition.size=2G',
    'fastboot.forceColdBoot=yes',
    'hw.accelerometer=yes',
    'hw.audioInput=no',
    'hw.battery=yes',
    'hw.camera.back=none',
    'hw.camera.front=none',
    'hw.cpu.arch=x86_64',
    'hw.cpu.ncore=2',
    'hw.dPad=no',
    'hw.gps=yes',
    'hw.gpu.enabled=yes',
    'hw.gpu.mode=swiftshader_indirect',
    'hw.initialOrientation=Portrait',
    'hw.keyboard=yes',
    'hw.lcd.density=420',
    'hw.lcd.height=1920',
    'hw.lcd.width=1080',
    'hw.mainKeys=no',
    'hw.ramSize=2048',
    'hw.sdCard=no',
    'hw.sensors.orientation=yes',
    'hw.sensors.proximity=yes',
    'hw.trackBall=no',
    `image.sysdir.1=${IMAGE_SYSDIR}`,
    'runtime.network.latency=none',
    'runtime.network.speed=full',
    'showDeviceFrame=no',
    'skin.dynamic=yes',
    'tag.display=Google APIs PlayStore',
    'tag.id=google_apis_playstore',
    'vm.heapSize=256',
    '',
  ].join('\n'));
}

function adbDevices() {
  if (!fs.existsSync(ADB)) return [];
  const result = spawnSync(ADB, ['devices', '-l'], { encoding: 'utf8', windowsHide: true });
  return (result.stdout || '')
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => /\sdevice\s/.test(line));
}

function launch(port) {
  const child = spawn(EMULATOR, [
    '-avd', AVD_NAME,
    '-read-only',
    '-no-window',
    '-no-audio',
    '-no-boot-anim',
    '-no-snapshot',
    '-gpu', 'swiftshader_indirect',
    '-port', String(port),
    '-no-metrics',
  ], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

function main() {
  if (!fs.existsSync(EMULATOR)) throw new Error(`Android emulator not found at ${EMULATOR}`);
  if (!fs.existsSync(ADB)) throw new Error(`ADB not found at ${ADB}`);

  const imagePath = path.join(SDK_ROOT, IMAGE_SYSDIR);
  if (!fs.existsSync(imagePath)) throw new Error(`Android system image not found at ${imagePath}`);

  ensureAvd();

  const current = adbDevices();
  if (current.length >= 2) {
    console.log(JSON.stringify({ ok: true, devices: current.length, already_running: true }));
    return;
  }

  launch(5554);
  setTimeout(() => launch(5556), 8000);
  console.log(JSON.stringify({ ok: true, launched: [5554, 5556], note: 'Wait 1-2 minutes, then run adb devices or npm run staging:preflight.' }));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
