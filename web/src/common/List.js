export const noneObject = {
    value: 'none',
    label: 'None'
};

export const activeList = [
    {
        value: true,
        label: 'True'
    },
    {
        value: false,
        label: 'False'
    },
    noneObject
];

export const statusList = [
    {
        value: 'open',
        label: 'Open'
    },
    {
        value: 'processing',
        label: 'Processing'
    },
    {
        value: 'resolved',
        label: 'Resolved'
    },
    noneObject
];

export const riskList = [
    {
        value: 'low',
        label: 'Low(0-4)'
    },
    {
        value: 'medium',
        label: 'Medium(5-7)'
    },
    {
        value: 'high',
        label: 'High(8-10)'
    },
    noneObject
];

export const ruleTypeList = [
    {
        value: 'eql',
        label: 'EQL'
    },
    {
        value: 'threshold',
        label: 'Threshold'
    },
    {
        value: 'none',
        label: 'None'
    }
];

export const typeList = [
    {
        value: 'alarm',
        label: 'Alarm'
    },
    {
        value: 'alert',
        label: 'Alert'
    },
    noneObject
];

export const sourceList = [
    {
        value: 'rule',
        label: 'Rule'
    },
    {
        value: 'baseline',
        label: 'Baseline'
    },
    noneObject
];

export const managedList = [
    {
        value: false,
        label: 'Unmanaged'
    },
    {
        value: true,
        label: 'Managed'
    },
    {
        value: 'none',
        label: 'None'
    }
];

export const intervalsList = [
    {
        value: '1d',
        label: 'Daily'
    },
    {
        value: '1w',
        label: 'Weekly'
    },
    {
        value: '1M',
        label: 'Monthly'
    }
];

export const timeframeList = ['5m', '10m', '30m', '1h', '12h', '1d', '3d', '1w', '1M', '1y'];
export const profillerTsList = ['day', 'week', 'month'];

export const functionList = ['count', 'unique', 'min', 'max', 'avg', 'sum'];
export const operatorsList = ['>', '>=', '==', '<', '<='];
export const condOperList = ['==', '!='];
