import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

const areaChartOptions = {
    chart: {
        height: 450,
        type: 'area',
        toolbar: {
            show: false
        }
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    grid: {
        strokeDashArray: 0
    }
};

const getCategoryLabels = (slot, data) => {
    if (!data) return '';

    const parsedKeys = [];
    Object.keys(data.events).map((key) => {
        parsedKeys.push(key.substring(5));
    });
    return slot === 'month' ? parsedKeys : parsedKeys.slice(parsedKeys.length - 7);
};

const getSeriesData = (slot, data) => {
    if (!data) return [];

    const parsedKeys = Object.values(data);
    return slot === 'month' ? parsedKeys : parsedKeys.slice(parsedKeys.length - 7);
};

const EventAlertChart = ({ type, slot, data }) => {
    const [options, setOptions] = useState(areaChartOptions);
    const [categoryLabels, setCategoryLabels] = useState([]);
    const [series, setSeries] = useState([]);

    const theme = useTheme();
    const { primary, secondary } = theme.palette.text;
    const line = theme.palette.divider;

    useEffect(() => {
        const labels = getCategoryLabels(slot, data);
        setCategoryLabels(labels);
    }, [data, slot]);

    useEffect(() => {
        setOptions((prevState) => ({
            ...prevState,
            colors: [theme.palette.primary.main, theme.palette.error.main],
            xaxis: {
                categories: categoryLabels,
                labels: {
                    style: {
                        colors: [secondary]
                    }
                },
                axisBorder: {
                    show: true,
                    color: line
                },
                tickAmount: slot === 'month' ? 11 : 7
            },
            yaxis: [
                {
                    labels: {
                        style: {
                            colors: [secondary]
                        }
                    },
                    title: {
                        text: 'Events'
                    }
                },
                {
                    opposite: true,
                    title: {
                        text: 'Alerts'
                    }
                }
            ],
            grid: {
                borderColor: line
            },
            tooltip: {
                theme: 'light'
            }
        }));
    }, [primary, secondary, line, theme, slot, type, categoryLabels]);

    useEffect(() => {
        setSeries([
            {
                type: 'area',
                name: 'Events',
                data: getSeriesData(slot, data?.events)
            },
            {
                type: 'line',
                name: 'Alerts',
                data: getSeriesData(slot, data?.alerts)
            }
        ]);
    }, [data, slot, type]);

    return <ReactApexChart options={options} series={series} type="area" height={450} />;
};

export default EventAlertChart;
