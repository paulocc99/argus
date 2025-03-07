import toast from 'react-hot-toast';

const ipv4_regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g;

export const datetimeToStr = (date) => {
    if (!date) return '';
    return date.split('.')[0].replace('T', ' ');
};

export const capitalizeWords = (arr) => {
    if (!arr) return '';
    if (Array.isArray(arr)) return arr.map((word) => capitalizeWord(word)).join(' ');
    let a = arr
        .split(' ')
        .map((word) => capitalizeWord(word))
        .join(' ');
    return a;
};

export const capitalizeWord = (str) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getIpv4Address = (list) => {
    if (list === undefined) return 'N/A';
    for (let ip of list) {
        if (ipv4_regex.test(ip)) return ip;
    }
    return list[0];
};

export const eventsNumberPretty = (events) => {
    if (events < 1e5) {
        return events;
    } else if (events < 1e6) {
        return `${String(events).substring(0, 3)}K`;
    } else if (events < 1e7) {
        return `${String(events).substring(0, 1)}.${String(events).substring(1, 2)}M`;
    } else {
        return `${String(events).substring(0, 3)}M`;
    }
};

export const setSuccess = (message) => {
    toast.success(message, { duration: 5000, position: 'bottom-right' });
};

export const setError = (error, message) => {
    toast.error(message || error.response.data.message, { duration: 5000, position: 'bottom-right' });
};

export const n = (value) => {
    return value == 'none' ? '' : value;
};
