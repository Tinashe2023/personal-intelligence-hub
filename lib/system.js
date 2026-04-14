import os from "os";
import { execSync } from "child_process";

/**
 * Get system metrics using Node.js built-in `os` module.
 * Works cross-platform — no Netdata dependency required.
 */
export async function getSystemStats() {
  const cpu = getCpuUsage();
  const ram = getRamUsage();
  const disk = getDiskUsage();
  const uptime = os.uptime();
  const platform = os.platform();
  const hostname = os.hostname();
  const arch = os.arch();
  const loadAvg = os.loadavg(); // [1min, 5min, 15min]

  return {
    cpu,
    ram,
    disk,
    uptime: formatUptime(uptime),
    uptimeSeconds: uptime,
    platform,
    hostname,
    arch,
    loadAvg,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate CPU usage from os.cpus() by comparing idle vs total time.
 * Takes a snapshot over ~100ms for accuracy.
 */
function getCpuUsage() {
  const cpus = os.cpus();
  const numCores = cpus.length;

  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    const { user, nice, sys, idle, irq } = cpu.times;
    totalTick += user + nice + sys + idle + irq;
    totalIdle += idle;
  }

  const avgIdle = totalIdle / numCores;
  const avgTotal = totalTick / numCores;
  const usage = ((avgTotal - avgIdle) / avgTotal) * 100;

  return {
    usage: Math.round(usage * 100) / 100,
    cores: numCores,
    model: cpus[0]?.model || "Unknown",
    speed: cpus[0]?.speed || 0, // MHz
  };
}

/**
 * Get RAM usage from os.totalmem() and os.freemem().
 */
function getRamUsage() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  const percentage = (usedBytes / totalBytes) * 100;

  return {
    total: formatBytes(totalBytes),
    used: formatBytes(usedBytes),
    free: formatBytes(freeBytes),
    totalBytes,
    usedBytes,
    freeBytes,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get disk usage — uses platform-specific commands.
 * Falls back gracefully if the command fails.
 */
function getDiskUsage() {
  try {
    const platform = os.platform();

    if (platform === "win32") {
      // Windows: use wmic
      const output = execSync(
        "wmic logicaldisk get size,freespace,caption /format:csv",
        { encoding: "utf-8", timeout: 5000 },
      );

      const lines = output.trim().split("\n").filter(Boolean);
      const drives = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(",");
        if (parts.length >= 4) {
          const caption = parts[1];
          const freeSpace = parseInt(parts[2]) || 0;
          const size = parseInt(parts[3]) || 0;
          if (size > 0) {
            const used = size - freeSpace;
            drives.push({
              mount: caption,
              total: formatBytes(size),
              used: formatBytes(used),
              free: formatBytes(freeSpace),
              percentage: Math.round((used / size) * 100 * 100) / 100,
            });
          }
        }
      }

      return drives.length > 0 ? drives : [getFallbackDisk()];
    } else {
      // Linux/macOS: use df
      const output = execSync("df -B1 --output=target,size,used,avail /", {
        encoding: "utf-8",
        timeout: 5000,
      });

      const lines = output.trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].trim().split(/\s+/);
        const total = parseInt(parts[1]) || 0;
        const used = parseInt(parts[2]) || 0;
        const free = parseInt(parts[3]) || 0;

        return [
          {
            mount: parts[0],
            total: formatBytes(total),
            used: formatBytes(used),
            free: formatBytes(free),
            percentage: total > 0 ? Math.round((used / total) * 100 * 100) / 100 : 0,
          },
        ];
      }

      return [getFallbackDisk()];
    }
  } catch {
    return [getFallbackDisk()];
  }
}

/**
 * Fallback disk info when platform commands fail.
 */
function getFallbackDisk() {
  return {
    mount: "N/A",
    total: "N/A",
    used: "N/A",
    free: "N/A",
    percentage: 0,
    error: "Could not retrieve disk info",
  };
}

/**
 * Format bytes into a human-readable string (e.g. "8.00 GB").
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format uptime seconds into a human-readable string.
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}
