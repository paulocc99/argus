import { Stack, Typography } from '@mui/material';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import Dot from 'components/@extended/Dot';
import Vertical from 'components/@extended/Vertical';
import { capitalizeWord } from 'utils';

export const AlertStatus = ({ status, title }) => {
    let color;

    switch (status) {
        case 'resolved':
            color = 'success';
            break;
        case 'processing':
            color = 'primary';
            break;
        case 'open':
            color = 'warning';
            break;
        default:
            color = 'primary';
    }

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Dot color={color} />
            <Typography>{title}</Typography>
        </Stack>
    );
};

export const RuleSeverity = ({ severity }) => {
    let color;

    switch (severity) {
        case 'low':
            color = 'success';
            break;
        case 'medium':
            color = 'warning';
            break;
        case 'high':
            color = 'error';
            break;
        default:
            color = 'primary';
    }

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Dot color={color} />
            <Typography>{severity}</Typography>
        </Stack>
    );
};

export const AlertRisk = ({ status, title }) => {
    let color;

    if (!status) {
        color = 'gray';
    } else if (status <= 4) {
        color = 'success';
    } else if (status <= 7) {
        color = 'warning';
    } else {
        color = 'error';
    }

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Dot color={color} />
            <Typography>{title ?? 'N/A'}</Typography>
        </Stack>
    );
};

export const AlertType = ({ type, panic }) => {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Vertical color={type == 'alert' ? 'warning' : 'error'} />
            <Typography>{capitalizeWord(type)}</Typography>
            {type == 'alarm' && panic && <CrisisAlertIcon />}
        </Stack>
    );
};
