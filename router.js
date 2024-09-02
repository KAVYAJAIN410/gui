const router = new Navigo('/', { hash: true });

// Function to render content based on the route
const renderRightContent = (user) => {
  const rightDiv = document.querySelector('.right');
  if (!user) {
    rightDiv.innerHTML = '<h1>Welcome</h1><p>Please select a user from the menu.</p>';
    return;
  }

  const userContent = {
    user1: '<h2>Content for User 1</h2><p>Details and information specific to User 1.</p>',
    user2: '<h2>Content for User 2</h2><p>Details and information specific to User 2.</p>',
    user3: '<h2>Content for User 3</h2><p>Details and information specific to User 3.</p>',
  };

  rightDiv.innerHTML = `
    <h1>Graphs for ${user.toUpperCase()}</h1>
    <p>${userContent[user] || 'Default Content'}</p>
    <div class="chart-container">
      <div id="temperature-chart" class="chart"></div>
      <div id="airSpeed-chart" class="chart"></div>
    </div>
    <div class="chart-container">
      <div id="altitude-chart" class="chart"></div>
      <div id="pressure-chart" class="chart"></div>
    </div>
  `;

  // Reinitialize charts to ensure they are rendered correctly
  initializeCharts();
};

// Function to initialize charts
const initializeCharts = () => {
  const temperatureChart = echarts.init(document.getElementById('temperature-chart'));
  const airSpeedChart = echarts.init(document.getElementById('airSpeed-chart'));
  const altitudeChart = echarts.init(document.getElementById('altitude-chart'));
  const pressureChart = echarts.init(document.getElementById('pressure-chart'));

  // Create chart options
  const createChartOption = (title) => ({
    title: { text: title },
    tooltip: {},
    xAxis: {
      type: 'time', // Time-based x-axis for smooth scrolling
      boundaryGap: false
    },
    yAxis: {},
    series: [{
      name: title,
      type: 'line',
      data: []
    }]
  });

  const temperatureOption = createChartOption('Temperature');
  const airSpeedOption = createChartOption('Air Speed');
  const altitudeOption = createChartOption('Altitude');
  const pressureOption = createChartOption('Pressure');

  temperatureChart.setOption(temperatureOption);
  airSpeedChart.setOption(airSpeedOption);
  altitudeChart.setOption(altitudeOption);
  pressureChart.setOption(pressureOption);

  window.electron.onSerialData((data) => {
    const values = data.split(',');
    if (values.length >= 12) {
      const temperature = values[9];
      const airSpeed = values[6];
      const altitude = values[5];
      const pressure = values[11];

      const newTime = new Date().getTime(); // Current time in milliseconds

      // Update each chart
      updateChart(temperatureChart, temperatureOption, newTime, temperature);
      updateChart(airSpeedChart, airSpeedOption, newTime, airSpeed);
      updateChart(altitudeChart, altitudeOption, newTime, altitude);
      updateChart(pressureChart, pressureOption, newTime, pressure);
    }
  });

  function updateChart(chart, option, time, value) {
    // Add new data point
    option.series[0].data.push([time, value]);

    // Remove old data points (older than 30 seconds)
    const thirtySecondsAgo = new Date().getTime() - 30 * 1000;
    option.series[0].data = option.series[0].data.filter(([timestamp]) => timestamp >= thirtySecondsAgo);

    // Set option and update chart
    chart.setOption(option);
  }
};

// Define routes
router.on('/user/:userId', (params) => {
  renderRightContent(params.userId);
}).resolve();

// Handle initial rendering based on the current URL
const currentPath = window.location.hash.slice(1) || '/';
const userId = currentPath.split('/').pop();
renderRightContent(userId);
