import { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';

import { capitalizeWord } from 'utils';

const slotSize = (slot) => {
    if (slot == 'month') return 27;
    if (slot == 'week') return 7;
    if (slot == 'day') return 24;
};

const areaChartOptions = {
    chart: {
        id: 'area-datetime',
        type: 'area',
        zoom: {
            autoScaleYaxis: true
        }
    },
    dataLabels: {
        enabled: false
    },
    markers: {
        size: 0,
        style: 'hollow'
    },
    xaxis: {
        type: 'datetime'
    }
};

const getCategoryLabels = (slot, data) => {
    if (data.length == 0) {
        return slot === 'month'
            ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }

    const parsedKeys = data.map((e) => e.date);
    if (slot == 'always' || slot == 'month' || slot == 'day') return parsedKeys;
    return parsedKeys.slice(parsedKeys.length - slotSize(slot));
};

const getSeriesData = (slot, data) => {
    if (data.length == 0) {
        return [];
    }
    const parsedValues = data.map((e) => e.value);
    if (slot == 'always' || slot == 'month' || slot == 'day') return parsedValues;
    return parsedValues.slice(parsedValues.length - slotSize(slot));
};

const alertTypeColor = (type) => (type == 'alarm' ? '#e30000' : '#faad14');

const getAlertAnnotations = (ranges) => {
    const base = {
        yaxis: []
    };

    if (!ranges) return base;

    for (const [type, conditions] of Object.entries(ranges)) {
        const color = alertTypeColor(type);
        for (const cond of conditions) {
            const range = parseInt(cond.limit);
            let template = {
                y: range,
                borderColor: color,
                label: {
                    borderColor: color,
                    style: {
                        color: '#fff',
                        background: color
                    },
                    text: `${capitalizeWord(type)} > ${range}`
                }
            };
            base.yaxis.push(template);
        }
    }
    return base;
};

const getMaxYFromConditions = (ranges) => {
    let currentMax = 10;
    if (!ranges) return currentMax;

    for (const [type, conditions] of Object.entries(ranges)) {
        for (const cond of conditions) {
            const range = parseInt(cond.limit);
            if (range > currentMax) {
                currentMax = range * 1.05;
            }
        }
    }
    return currentMax;
};

const ProfilerChart = ({ type, slot, data, ranges }) => {
    const theme = useTheme();

    const { primary, secondary } = theme.palette.text;
    const line = theme.palette.divider;

    const [options, setOptions] = useState(areaChartOptions);
    const [categoryLabels, setCategoryLabels] = useState([]);

    useEffect(() => {
        const labels = getCategoryLabels(slot, data);
        setCategoryLabels(labels);
    }, [data, slot]);

    const maxY = getMaxYFromConditions(ranges);
    // TODO - retrieve data max value

    useEffect(() => {
        setOptions((prevState) => ({
            ...prevState,
            xaxis: {
                categories: categoryLabels
            },
            yaxis: {
                max: maxY,
                labels: {
                    style: {
                        colors: [secondary]
                    },
                    formatter: (value) => parseInt(value)
                },
                tickAmount: 5,
                title: {
                    text: 'Value'
                }
            },
            grid: {
                borderColor: line
            },
            tooltip: {
                x: {
                    format: slot != 'day' ? 'dd MMM yyyy' : 'dd-MMM HH:mm'
                }
            },
            annotations: getAlertAnnotations(ranges)
        }));
    }, [primary, secondary, line, theme, slot, type, categoryLabels]);

    const [series, setSeries] = useState([
        {
            type: 'area',
            name: 'Value',
            data: []
        }
    ]);

    useEffect(() => {
        setSeries([
            {
                type: 'area',
                name: 'Value',
                data: getSeriesData(slot, data)
            }
        ]);
    }, [data, slot, type]);

    return <ReactApexChart options={options} series={series} type="area" height={450} />;
};

export default ProfilerChart;
