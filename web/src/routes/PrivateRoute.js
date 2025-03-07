import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const authenticated = localStorage.getItem('auth') ? true : false;
    return authenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
