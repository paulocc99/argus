import { Link } from 'react-router-dom';

import { ButtonBase } from '@mui/material';

import Logo from './Logo';
import config from 'config';

const LogoSection = ({ sx, to }) => (
    <ButtonBase disableRipple component={Link} to={!to ? config.defaultPath : to} sx={sx}>
        <Logo />
    </ButtonBase>
);

export default LogoSection;
