import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useTheme } from '@mui/material/styles';

const areaChartOptions = {
    chart: {
        height: 340,
        type: 'donut',
        toolbar: {
            show: false
        }
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth',
        width: 1.5
    },
    grid: {
        strokeDashArray: 4
    },
    labels: []
};

const DonutGraph = (props) => {
    const { series, labels } = props;

    const theme = useTheme();
    const { primary, secondary } = theme.palette.text;
    const line = theme.palette.divider;

    const [options, setOptions] = useState(areaChartOptions);

    useEffect(() => {
        setOptions((prevState) => ({
            ...prevState,
            xaxis: {
                labels: {
                    style: {
                        colors: [secondary, secondary, secondary, secondary, secondary, secondary, secondary, secondary]
                    }
                }
            },
            grid: {
                borderColor: line
            },
            tooltip: {
                theme: 'light'
            },
            legend: {
                labels: {
                    colors: 'grey.500'
                }
            },
            labels: labels
        }));
    }, [primary, secondary, line, theme, series, labels]);

    return <ReactApexChart options={options} series={series} type="donut" />;
};

export default DonutGraph;
