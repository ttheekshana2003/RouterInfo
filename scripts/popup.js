function extractNumericValue(valueWithUnits) {
    if (typeof valueWithUnits !== 'string') {
        return 0;
    }

    const numericValue = parseFloat(valueWithUnits.replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
}

function formatMemoryValue(memoryWithUnits) {
    const memoryInKB = extractNumericValue(memoryWithUnits);
    const memoryInMB = memoryInKB / 1024;
    return memoryInMB.toFixed(2) + " MB";
}

function formatTrafficValue(trafficInBytes) {
    const trafficInGB = trafficInBytes / (1024 * 1024 * 1024);
    return trafficInGB.toFixed(2) + " GB";
}

function formatTimeValue(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds % 60)}`;
    return formattedTime;
}

function padZero(value) {
    return value.toString().padStart(2, "0");
}

function createCPUProgressBar(cpu) {
    const cpuUsage = extractNumericValue(cpu);
    const cpuUsedPercentage = (cpu / 100) * 100
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.width = `${cpuUsedPercentage}%`;

    const progressText = document.createElement("div");
    progressText.className = "progress-text";
    progressText.innerText = `${cpuUsedPercentage}%`;

    progressBar.appendChild(progressFill);
    progressBar.appendChild(progressText);

    return progressBar;
}

function createMemoryProgressBar(memT, memF) {
    const memTotal = extractNumericValue(memT);
    const memFree = extractNumericValue(memF);
    const usedPercentage = ((memTotal - memFree) / memTotal) * 100;

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.width = `${usedPercentage}%`;

    const progressText = document.createElement("div");
    progressText.className = "progress-text";
    progressText.innerText = `${usedPercentage.toFixed(2)}%`;

    progressBar.appendChild(progressFill);
    progressBar.appendChild(progressText);

    return progressBar;
}

function formatRateValue(rateInKbps) {
    const rateInMB = rateInKbps / 1048576;
    return rateInMB.toFixed(2) + " MB/s";
}

function updateSystemStatus() {
    // Make an AJAX request to retrieve system status information
    fetch("http://192.168.8.1/goform/goform_get_cmd_process?isTest=false&cmd=system_status")
        .then(response => response.json())
        .then(data => {
            // Update the popup menu with the received information
            var infoContainer2 = document.getElementById("info-container2");
            var status = document.getElementById("status");
            var internet = document.getElementById("internet");
            if (infoContainer2) {
                if (data.service_status === "network_type_no_service") {
                    connection = "No Internet";
                    internet.className = "no-internet";
                    network_type = ``;
                    lte_band = ``;
                    plmn = ``;
                } else {
                    connection = data.service_status
                    network_type = `Network Type: ${data.network_type}<br>`
                    lte_band = `LTE Band: ${data.lte_band}<br>`
                    plmn = `ISP: ${data.plmn}<br>`
                }
                internet.innerHTML = `${connection}`
                infoContainer2.innerHTML = `SIM Status: ${data.sim_status}<br>
                                    ${network_type}
                                    ${plmn}
                                    WAN IP: ${data.wan_ip}<br>
                                    ${lte_band}                                                                      
                                    Limit Switch: ${data.limit_switch}<br>
                                    Online Time: ${formatTimeValue(data.online_time)}<br>`;


                // Update infoData and dataRate elements
                var infoData = document.getElementById("info-data");
                var dataRate = document.getElementById("data-rate");
                if (infoData) {
                    infoData.innerHTML = `&UpArrowBar; Uplink Traffic: ${formatTrafficValue(data.uplink_traffic)}<br>
                                    &DownArrowBar; Downlink Traffic: ${formatTrafficValue(data.downlink_traffic)}<br>`;
                }
                if (dataRate) {
                    dataRate.innerHTML = `Uplink Rate: ${formatRateValue(data.uplink_rate)}<br>
                                      Downlink Rate: ${formatRateValue(data.downlink_rate)}<br>`;
                }
            }
        })
        .catch(error => {
            console.error("Error fetching system status:", error);
        });
}

function updateMemoryStatus() {
    fetch("http://192.168.8.1/goform/goform_get_cmd_process?isTest=false&cmd=loginfo")
        .then(response => response.json())
        .then(data => {
            if (data.loginfo === "ok") {
                // Make another AJAX request to retrieve memory information
                fetch("http://192.168.8.1/goform/goform_get_cmd_process?isTest=false&cmd=tz_dynamic_info")
                    .then(response => response.json())
                    .then(memoryData => {
                        // Update the popup menu with the received memory information
                        var infoContainer = document.getElementById("info-container");
                        if (infoContainer) {
                            infoContainer.innerHTML = `Total Memory: ${formatMemoryValue(memoryData.mem_total)}<br>
                                            Free Memory: ${formatMemoryValue(memoryData.mem_free)}<br>
                                            Cached Memory: ${formatMemoryValue(memoryData.mem_cached)}<br>
                                            Active Memory: ${formatMemoryValue(memoryData.mem_active)}<br>
                                            <br>CPU Usage: ${memoryData.tz_cpu_usage}<br>`;
                            const cpuUsage = extractNumericValue(memoryData.tz_cpu_usage);
                            const cpuUsageProgress = createCPUProgressBar(cpuUsage);
                            infoContainer.appendChild(cpuUsageProgress);
                            memT = extractNumericValue(memoryData.mem_total);
                            memF = extractNumericValue(memoryData.mem_free);
                            usedPercentage = ((memT - memF) / memT) * 100;
                            infoContainer.innerHTML += `<br>Memory Usage: ${usedPercentage.toFixed(2)}%`;
                            const memoryUsageProgress = createMemoryProgressBar(memoryData.mem_total, memoryData.mem_free);
                            infoContainer.appendChild(memoryUsageProgress);

                        }
                    })
                    .catch(error => {
                        console.error("Error fetching memory data:", error);
                    });
            } else {
                var infoContainer = document.getElementById("info-container");
                if (infoContainer) {
                    infoContainer.innerHTML = "Please login to view this data.";
                }
            }
        })
        .catch(error => {
            console.error("Error fetching login status:", error);
        });
}

function updateVersion() {
    //copyright.innerHTML = `T.Theekshana  2023`
    fetch("./manifest.json")
        .then(response => response.json())
        .then(versionData => {
            var copyright = document.getElementById("copy");
            if (copyright) {
                copyright.innerHTML = `${versionData.name} v${versionData.version}<br>
                                        T.Theekshana &copy; 2023`
            }
        })
        .catch(error => {
            console.error("Error fetching version info:", error);
        });
}



// Update the system status initially
updateSystemStatus();
updateMemoryStatus();
updateVersion();

setInterval(() => {
    if (document.documentElement) {
        updateMemoryStatus();
    }
}, 5000);
// Update the system status every second when the popup is open
setInterval(() => {
    if (document.documentElement) {
        updateSystemStatus();
    }
}, 1000);