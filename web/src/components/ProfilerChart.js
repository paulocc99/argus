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
        height: 350,
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
        //tickAmount: 6
    },
    yaxis: {
        tickAmount: 5
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
        return slot === 'month' ? [76, 85, 101, 98, 87, 105, 91, 114, 94, 86, 115, 35] : [31, 40, 28, 51, 42, 109, 100];
    }
    const parsedValues = data.map((e) => e.value);
    if (slot == 'always' || slot == 'month' || slot == 'day') return parsedValues;
    // console.log(parsedValues.slice(parsedValues.length - slotSize(slot)));
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

    useEffect(() => {
        setOptions((prevState) => ({
            ...prevState,
            xaxis: {
                categories: categoryLabels
            },
            yaxis: {
                max: 12,
                labels: {
                    style: {
                        colors: [secondary]
                    },
                    formatter: (value) => parseInt(value)
                },
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
            name: 'Page Views',
            data: [1, 2, 3, 4, 5, 6, 7]
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
