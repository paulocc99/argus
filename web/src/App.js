import { Toaster } from 'react-hot-toast';

import Routes from 'routes';
import ThemeCustomization from 'themes';
import ScrollTop from 'components/ScrollTop';

const App = () => (
    <ThemeCustomization>
        <ScrollTop>
            <Routes />
        </ScrollTop>
        <Toaster />
    </ThemeCustomization>
);

export default App;
