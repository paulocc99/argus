import axios from 'axios';

const axiosClient = axios.create({
    // baseURL: '/api',
    baseURL: 'http://localhost:1337/api',
    headers: {
        'Content-type': 'application/json'
    },
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log(error.response);
        if ([401, 403].includes(error.response.status)) {
            localStorage.clear();
            window.location = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
