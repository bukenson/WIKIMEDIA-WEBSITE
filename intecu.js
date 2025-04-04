const fs = require('fs');
const moment = require('moment'); 

 const logRegex = /^(\S+) - - \[([^\]]+)\] "(GET|POST|PUT|DELETE) ([^\s]+) HTTP\/1\.\d" (\d{3}) (\d+) "([^"]*)" "([^"]*)"/;

const parseLogLine = (logLine) => {
  const match = logLine.match(logRegex);
  if (match) {
    return {
      ip: match[1],
      timestamp: match[2],
      method: match[3],
      url: match[4],
      statusCode: match[5],
      responseSize: match[6],
      referrer: match[7],
      userAgent: match[8],
    };
  }
  return null;
};

 const convertLogToJson = (filePath) => {
  const logs = fs.readFileSync(filePath, 'utf-8').split('\n');
  const jsonLogs = logs
    .map(parseLogLine)
    .filter(log => log !== null); 
  return JSON.stringify(jsonLogs, null, 2);
};

 const filePath = 'access_log.processed'; 
const jsonOutput = JSON.parse(convertLogToJson(filePath));

const countVisitsPerIP = (logs) => {
    const ipCounts = logs.reduce((acc, log) => {
      acc[log.ip] = (acc[log.ip] || 0) + 1;
      return acc;
    }, {});
  
     const sortedIPCounts = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([ip, count]) => ({ ip, count }));
  
    return sortedIPCounts;
  };
  
   const countVisitsPerURL = (logs) => {
    logs = logs.filter(({ip})=>ip =="127.0.0.1");
    const urlCounts = logs.reduce((acc, log) => {
      acc[log.url] = (acc[log.url] || 0) + 1;
      return acc;
    }, {});
  
     const sortedURLCounts = Object.entries(urlCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([url, count]) => ({ url, count }));
  
    return sortedURLCounts;
  };
  
  

const ips = countVisitsPerIP(jsonOutput);
// console.log(countVisitsPerIP(jsonOutput));
// console.log(countVisitsPerURL(jsonOutput));


const getLocationByIP = async (ip) => {
    const url = `http://ip-api.com/json/${ip}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      // If the status is 'fail', it means the geolocation data could not be fetched
      if (data.status === 'fail') {
        return { ip, error: 'Geolocation failed' };
      }
  
      const { city, regionName, country, lat, lon, isp, org } = data;
  
      return {
        ip,
        city,
        region: regionName,
        country,
        latitude: lat,
        longitude: lon,
        isp,
        org,
      };
    } catch (error) {
      console.error(`Error fetching location for IP ${ip}:`, error.message);
      return null;
    }
  };

  const countRequestsPerDateHourMinute = (logs, targetIP) => {
    const counts = {};
  
    logs.forEach(log => {
      const ip = log.ip;   
      const timestamp = log.timestamp;  
      
      if (ip !== targetIP) return;  
      
      const parsedTimestamp = moment(timestamp, 'DD/Mon/YYYY:HH:mm:ss Z'); 
      
      const dateKey = parsedTimestamp.format('YYYY-MM-DD');
      const hourKey = parsedTimestamp.format('HH');
      const minuteKey = parsedTimestamp.format('HH:mm');
  
      if (!counts[dateKey]) counts[dateKey] = {};
      if (!counts[dateKey][hourKey]) counts[dateKey][hourKey] = {};
      if (!counts[dateKey][hourKey][minuteKey]) counts[dateKey][hourKey][minuteKey] = 0;
  
      counts[dateKey][hourKey][minuteKey]++;
    });
  
    return counts;
  };
  
 const getTodaysRequests = (logs) => {
    const today = moment().format('YYYY-MM-DD');  
  
     const todaysLogs = logs.filter(log => {
      const timestamp = log.timestamp;  
      const logDate = moment(timestamp, 'DD/MMM/YYYY:HH:mm:ss Z').format('YYYY-MM-DD');

       return logDate === today;
    });
  
    return todaysLogs;
  };

  const logsFromToday = getTodaysRequests(jsonOutput);
  
//   console.log(countRequestsPerDateHourMinute(jsonOutput, "14.18.119.55"));

console.log("logsFromToday::: ", logsFromToday);

console.log(countVisitsPerIP(logsFromToday));
console.log(countVisitsPerURL(logsFromToday));

console.log(countRequestsPerDateHourMinute(logsFromToday, "216.244.66.201"));