const echarts = window.electron.echarts;

// Initialize ECharts
const chart = echarts.init(document.getElementById('chart'));

const option = {
    title: {
        text: 'Real-Time Data'
    },
    tooltip: {
        trigger: 'axis'
    },
    xAxis: {
        type: 'time',
        boundaryGap: false
    },
    yAxis: {
        type: 'value'
    },
    series: [{
        name: 'Value',
        type: 'line',
        showSymbol: false,
        data: []
    }]
};

chart.setOption(option);
