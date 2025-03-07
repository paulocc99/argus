import axios from 'axios';

const axiosClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-type': 'application/json'
    },
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // console.log(error.response);
        if ([401].includes(error.response.status)) {
            localStorage.clear();
            window.location = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
