import { Toaster } from 'react-hot-toast';

import Routes from 'routes';
import ThemeCustomization from 'themes';
import ScrollTop from 'components/ScrollTop';
import StatusWrapper from './components/StatusWrapper';

const App = () => (
    <ThemeCustomization>
        <ScrollTop>
            <StatusWrapper>
                <Routes />
            </StatusWrapper>
        </ScrollTop>
        <Toaster />
    </ThemeCustomization>
);

export default App;
